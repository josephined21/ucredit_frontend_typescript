import axios from 'axios';
import { useRouter } from 'next/router';
import React, { FC, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { getLoginCookieVal, getAPI } from '../../../resources/assets';
import { DashboardMode } from '../../../resources/commonTypes';
import {
  resetCurrentPlan,
  selectPlan,
  updateSelectedPlan,
} from '../../../slices/currentPlanSlice';
import {
  resetUser,
  selectPlanList,
  selectUser,
  updatePlanList,
} from '../../../slices/userSlice';

const HamburgerMenu: FC<{
  mode: DashboardMode;
}> = ({ mode }) => {
  // Redux Setup
  const planList = useSelector(selectPlanList);
  const currentPlan = useSelector(selectPlan);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();
  const [cookies, , removeCookie] = useCookies(['connect.sid']);
  const [openHamburger, setOpenHamburger] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>(currentPlan.name);
  const [editName, setEditName] = useState<boolean>(false);

  // Only edits name if editName is true. If true, calls debounce update function
  useEffect(() => {
    if (editName) {
      const update = setTimeout(updateName, 1000);
      return () => clearTimeout(update);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planName]);

  // Updates current plan every time current plan changes
  useEffect((): void => {
    setPlanName(currentPlan.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlan._id]);

  const updateName = (): void => {
    const body = {
      plan_id: currentPlan._id,
      majors: currentPlan.majors,
      name: planName,
    };
    fetch(getAPI(window) + '/plans/update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then(() => {
        const newUpdatedPlan = { ...currentPlan, name: planName };
        dispatch(updateSelectedPlan(newUpdatedPlan));
        let newPlanList = [...planList];
        for (let i = 0; i < planList.length; i++) {
          if (newPlanList[i]._id === currentPlan._id) {
            newPlanList[i] = { ...newUpdatedPlan };
          }
        }
        toast.success('Plan name changed to ' + planName + '!');
        setEditName(false);
        dispatch(updatePlanList(newPlanList));
      })
      .catch((err) => console.log(err));
  };

  const handleLogoutClick = (): void => {
    const loginId = getLoginCookieVal(cookies);
    if (getAPI(window).includes('ucredit.me'))
      axios
        .delete(getAPI(window) + '/verifyLogin/' + loginId)
        .then(() => logOut())
        .catch((err) => {
          console.log('error logging out', err);
        });
    else logOut();
  };

  const logOut = () => {
    removeCookie('connect.sid', { path: '/' });
    dispatch(resetUser());
    dispatch(resetCurrentPlan());
    router.push('/login');
  };
  return (
    <>
      <div
        className="z-40 p-[0.53rem] pt-[0.6rem] space-y-1 bg-white rounded shadow h-9 w-9 mx-2 cursor-pointer absolute top-3 right-7"
        onClick={() => setOpenHamburger(!openHamburger)}
      >
        <span className="block w-5 h-[0.2rem] bg-black"></span>
        <span className="block w-5 h-[0.2rem] bg-black"></span>
        <span className="block w-5 h-[0.2rem] bg-black"></span>
      </div>
      {openHamburger && (
        <aside
          className="w-72 top-14 z-40 absolute right-0 shadow-lg"
          aria-label="Sidebar"
        >
          <div className="overflow-y-auto py-4 px-3 bg-white rounded">
            <ul className="space-y-2">
              <li>
                <span className="self-center text-xl font-semibold whitespace-nowrap">
                  {typeof window !== 'undefined' && window.innerWidth > 600 && (
                    <div className="ml-2">{user.name}</div>
                  )}
                </span>
              </li>
              <li>
                <button
                  onClick={() =>
                    router.push(
                      mode === DashboardMode.Advising
                        ? '/dashboard'
                        : '/reviewer',
                    )
                  }
                  className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg hover:bg-gray-100 w-full"
                >
                  <svg
                    className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l2-2a1 1 0 00-1.414-1.414L11 7.586V3a1 1 0 10-2 0v4.586l-.293-.293z"></path>
                    <path d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v7h2l1 2h4l1-2h2V5h-1a1 1 0 110-2h1a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z"></path>
                  </svg>
                  <span className="flex-1 ml-3 whitespace-nowrap text-left">
                    {mode === DashboardMode.Advising
                      ? DashboardMode.Planning
                      : DashboardMode.Advising}{' '}
                    {' Dashboard'}
                  </span>
                </button>
              </li>
              <li>
                {user._id === 'guestUser' ? (
                  <a
                    href="https://ucredit-api.herokuapp.com/api/login"
                    className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg hover:bg-gray-100"
                  >
                    <svg
                      className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="flex-1 ml-3 whitespace-nowrap">
                      Sign In
                    </span>
                  </a>
                ) : (
                  <button
                    onClick={handleLogoutClick}
                    className="flex items-center p-2 text-base w-full font-normal text-gray-900 rounded-lg hover:bg-gray-100"
                  >
                    <svg
                      className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                    <span className="flex-1 ml-3 whitespace-nowrap w-full text-left">
                      Sign Out
                    </span>
                  </button>
                )}
              </li>
            </ul>
          </div>
        </aside>
      )}
    </>
  );
};

export default HamburgerMenu;