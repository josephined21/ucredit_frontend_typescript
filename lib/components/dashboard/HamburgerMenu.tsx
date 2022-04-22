import { TrashIcon } from '@heroicons/react/outline';
import { PencilAltIcon, PlusIcon } from '@heroicons/react/solid';
import axios from 'axios';
import { useRouter } from 'next/router';
import React, { FC, useEffect, useState } from 'react';
import { useCookies } from 'react-cookie';
import { useDispatch, useSelector } from 'react-redux';
import Select, {
  components,
  MultiValueProps,
  StylesConfig,
} from 'react-select';
import { toast } from 'react-toastify';
import { getLoginCookieVal, getAPI } from '../../resources/assets';
import {
  DashboardMode,
  Plan,
  ReviewMode,
  Year,
} from '../../resources/commonTypes';
import { allMajors } from '../../resources/majors';
import {
  resetCurrentPlan,
  selectPlan,
  updateCurrentPlanCourses,
  updateSelectedPlan,
} from '../../slices/currentPlanSlice';
import {
  selectInfoPopup,
  updateAddingPlanStatus,
  updateDeletePlanStatus,
  updateInfoPopup,
} from '../../slices/popupSlice';
import {
  resetUser,
  selectPlanList,
  selectReviewMode,
  selectUser,
  updatePlanList,
} from '../../slices/userSlice';
import Reviewers from './degree-info/Reviewers/Reviewers';
import ShareLinksPopup from './degree-info/ShareLinksPopup';

const majorOptions = allMajors.map((major, index) => ({
  value: index,
  label: major.degree_name,
}));

const HamburgerMenu: FC<{
  openHamburger: boolean;
  setOpenHamburger: (openHamburger: boolean) => void;
  mode: DashboardMode;
}> = ({ openHamburger, mode, setOpenHamburger }) => {
  // Redux Setup
  const planList = useSelector(selectPlanList);
  const currentPlan = useSelector(selectPlan);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();
  const infoPopup = useSelector(selectInfoPopup);
  const reviewMode = useSelector(selectReviewMode);
  const [cookies, , removeCookie] = useCookies(['connect.sid']);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const [planName, setPlanName] = useState<string>(currentPlan.name);
  const [editName, setEditName] = useState<boolean>(false);
  const [shareableURL, setShareableURL] = useState<string>('');

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

  const handlePlanChange = (event) => {
    if (event.label === 'Create New Plan' && user._id !== 'noUser') {
      dispatch(updateAddingPlanStatus(true));
    } else {
      toast(event.value.name + ' selected!');
      if (currentPlan._id !== event.value._id)
        dispatch(updateCurrentPlanCourses([]));
      dispatch(updateSelectedPlan(event.value));
    }
  };

  /**
   * Updates temporary plan name and notifies useffect on state change to update db plan name with debounce.
   * @param event
   */
  const handlePlanNameChange = (event: any): void => {
    setPlanName(event.target.value);
    setEditName(true);
  };

  /**
   * Limit the max width of multi-select labels
   */
  const customStyles: StylesConfig<typeof majorOptions[number], true> = {
    multiValue: (provided) => {
      const maxWidth = '17rem';
      return { ...provided, maxWidth };
    },
  };

  const handleMajorChange = (event: any) => {
    if (event.length === 0) {
      toast.error('You must have at least one major!');
      return;
    }
    const body = {
      plan_id: currentPlan._id,
      majors: event.map((option) => option.label),
    };
    axios
      .patch(getAPI(window) + '/plans/update', body)
      .then(({ data }) => {
        const newUpdatedPlan = { ...currentPlan, majors: data.data.majors };
        dispatch(updateSelectedPlan(newUpdatedPlan));
        let newPlanList = [...planList];
        for (let i = 0; i < planList.length; i++) {
          if (newPlanList[i]._id === currentPlan._id) {
            newPlanList[i] = { ...newUpdatedPlan };
          }
        }
        dispatch(updatePlanList(newPlanList));
      })
      .catch((err) => console.log(err));
  };

  /**
   * Show major multi-select's displayed major name to abbreviations (B.S. Computer Science => B.S. CS)
   * if user selected more than one major
   */
  const MultiValue = (
    props: MultiValueProps<typeof majorOptions[number], true>,
  ) => {
    const major = allMajors.find(
      (majorObj) => majorObj.degree_name === props.data.label,
    );
    // @ts-ignore
    const showAsAbbrev = props.selectProps.value.length > 1;
    return (
      <components.MultiValue {...props}>
        {showAsAbbrev ? major?.abbrev : major?.degree_name}
      </components.MultiValue>
    );
  };

  // Activates delete plan popup.
  const activateDeletePlan = (): void => {
    dispatch(updateDeletePlanStatus(true));
  };

  /**
   * Handles when button for shareable link is clicked.
   */
  const onShareClick = (): void => {
    if (shareableURL !== '') {
      setShareableURL('');
      return;
    }
    console.log(window.location.origin);
    setShareableURL(window.location.origin + '/share?_id=' + currentPlan._id);
  };

  /**
   * Adds a new year, if preUni is true, add to the start of the plan, otherwise add to the end
   * @param preUniversity - whether the new year is a pre uni year
   */
  const addNewYear = (preUniversity: boolean): void => {
    if (currentPlan.years.length < 8) {
      const newYear: Year = {
        name: 'New Year',
        _id: '',
        plan_id: currentPlan._id,
        user_id: user._id,
        courses: [],
        year: currentPlan.years[currentPlan.years.length - 1].year + 1,
      };

      const body = {
        ...newYear,
        preUniversity: preUniversity,
        expireAt:
          user._id === 'guestUser'
            ? Date.now() + 60 * 60 * 24 * 1000
            : undefined,
      }; // add to end by default
      axios
        .post(getAPI(window) + '/years', body)
        .then((response: any) => {
          const updatedPlanList: Plan[] = [...planList];
          updatedPlanList[0] = {
            ...currentPlan,
            years: [...currentPlan.years, { ...response.data.data }],
          };
          dispatch(updateSelectedPlan(updatedPlanList[0]));
          dispatch(updatePlanList(updatedPlanList));
          toast.success('New Year added!');
        })
        .catch((err) => console.log(err));
    } else {
      toast.error("Can't add more than 8 years!");
    }
  };

  return (
    <div>
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
                <Select
                  options={[
                    ...planList
                      .filter((plan) => plan._id !== currentPlan._id)
                      .map((plan) => ({ value: plan, label: plan.name })),
                    { value: currentPlan, label: 'Create New Plan' },
                  ]}
                  value={{ label: currentPlan.name, value: currentPlan }}
                  onChange={handlePlanChange}
                  className="mr-2 thin:mx-auto text-lg font-light mt-[0.15rem]"
                />
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
                  <span className="inline-flex justify-center items-center p-3 ml-3 w-3 h-3 text-sm font-medium text-blue-600 bg-blue-200 rounded-full">
                    3
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    dispatch(updateInfoPopup(!infoPopup));
                    setOpenHamburger(false);
                  }}
                  className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg hover:bg-gray-100 w-full"
                >
                  <svg
                    className="flex-shrink-0 w-6 h-6 text-gray-500 transition duration-75 group-hover:text-gray-900"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                    <path
                      fill-rule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span className="flex-1 ml-3 whitespace-nowrap w-full text-left">
                    Degree Progresss{' '}
                  </span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => setOpenEdit(!openEdit)}
                  className="flex items-center p-2 text-base font-normal text-gray-900 rounded-lg hover:bg-gray-100 w-full"
                >
                  <span className="flex-1 ml-0.5 whitespace-nowrap w-full text-left flex flex-row">
                    <PencilAltIcon className="bg-gray-100 w-[1.4rem] text-gray-500 mr-3" />{' '}
                    Edit Plan
                  </span>
                </button>
              </li>
              {openEdit && (
                <>
                  <ul className="pt-4 space-y-2 border-t border-gray-200">
                    <li>
                      <div className="flex flex-row items-end bg-white border border-gray-300 rounded h-10 mr-2">
                        <div className="m-auto ml-2 mr-0 text-xl">✎</div>
                        <input
                          value={planName}
                          className=" my-0.5 px-1 h-8 text-gray-800 text-lg outline-none w-full"
                          onChange={handlePlanNameChange}
                        />
                      </div>
                    </li>
                    <li>
                      <form
                        data-testid="major-change-form"
                        className="z-20 w-full pr-2"
                      >
                        <label htmlFor="majorChange" hidden={true}>
                          majorChange
                        </label>
                        <Select
                          components={{ MultiValue }}
                          isMulti
                          isClearable={false}
                          options={majorOptions}
                          value={majorOptions.filter((major) =>
                            currentPlan.majors.includes(major.label),
                          )}
                          styles={customStyles}
                          onChange={handleMajorChange}
                          placeholder="Change Major"
                          name="majorChange"
                          inputId="majorChange"
                        />
                      </form>
                    </li>
                    <li className="flex flex-row">
                      <button
                        className="flex flex-row items-center h-10 px-2 my-1 ml-1 mr-2 transition duration-200 ease-in border border-gray-300 rounded hover:underline hover:bg-primary"
                        onClick={onShareClick}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-6 h-6 transition duration-200 ease-in transform hover:scale-110"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        <div className="ml-1">Share</div>
                      </button>
                      <div className=" thin:mx-auto flex mr-2 flex-row items-center text-left w-full h-10 my-1 transition duration-200 ease-in border border-gray-300 rounded cursor-pointer hover:underline hover:bg-green-300 focus:outline-none">
                        <PlusIcon
                          onClick={() => addNewYear(false)}
                          data-tip={`Add a new year!`}
                          data-for="godTip"
                          className="w-5 h-5 ml-2 m-auto focus:outline-none"
                        />
                        <div className="w-full ml-1">{' Add Year'}</div>
                      </div>
                      <button
                        className="flex flex-row items-center h-10 px-2 my-1 mr-2 transition duration-200 ease-in border border-gray-300 rounded hover:underline hover:bg-red-300"
                        onClick={activateDeletePlan}
                      >
                        <TrashIcon className="w-5 my-auto transition duration-200 ease-in transform cursor-pointer select-none stroke-2 hover:scale-110" />{' '}
                      </button>
                    </li>
                    <li>
                      {shareableURL === '' ? null : (
                        <ShareLinksPopup
                          link={shareableURL}
                          setURL={onShareClick}
                        />
                      )}
                    </li>
                  </ul>
                </>
              )}
              <ul className="pt-2 space-y-2 border-t border-b pb-2 border-gray-200">
                {reviewMode !== ReviewMode.View && <Reviewers />}
              </ul>
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
                        fill-rule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                        clip-rule="evenodd"
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
                        fill-rule="evenodd"
                        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                        clip-rule="evenodd"
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
    </div>
  );
};

export default HamburgerMenu;
