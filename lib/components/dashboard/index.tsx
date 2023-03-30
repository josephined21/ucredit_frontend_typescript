import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from './Header';
import FeedbackPopup from '../popups/FeedbackPopup';
import FeedbackNotification from '../popups/FeedbackNotification';

import {
  selectImportingStatus,
  selectPlan,
  updateThreads,
} from '../../slices/currentPlanSlice';
import {
  selectDeletePlanStatus,
  selectAddingPlanStatus,
  selectDeleteYearStatus,
  selectCourseToDelete,
  selectShowCourseInfo,
  selectAddingPrereq,
  selectShowingCart,
  selectInfoPopup,
  updateInfoPopup,
} from '../../slices/popupSlice';
import {
  selectExperimentList,
  setExperiments,
  toggleExperimentStatus,
} from '../../slices/experimentSlice';
import { selectSearchStatus } from '../../slices/searchSlice';
import AddingPrereqPopup from '../popups/AddingPrereqPopup';
import Search from '../popups/course-search/Search';
import CourseDisplayPopup from '../popups/CourseDisplayPopup';
import DeleteCoursePopup from '../popups/DeleteCoursePopup';
import DeletePlanPopup from '../popups/DeletePlanPopup';
import DeleteYearPopup from '../popups/DeleteYearPopup';
import PlanAdd from '../popups/PlanAdd';
import CourseList from './course-list/CourseList';
import InfoMenu from './degree-info/InfoMenu';
import {
  selectLoginCheck,
  selectToken,
  selectUser,
  updateCommenters,
  updateCourseCache,
} from '../../slices/userSlice';
import axios from 'axios';
import { getAPI } from './../../resources/assets';
import Cart from '../popups/course-search/Cart';
import GenerateNewPlan from '../../resources/GenerateNewPlan';
import LoadingPage from '../LoadingPage';
import HandlePlanShareDummy from './HandlePlanShareDummy';
import HandleUserInfoSetupDummy from './HandleUserInfoSetupDummy';
import {
  DashboardMode,
  ReviewMode,
  SISRetrievedCourse,
} from '../../resources/commonTypes';
import { userService } from '../../services';
import Actionbar from './Actionbar';
import Button from '@mui/material/Button';
import clsx from 'clsx';
import Footer from '../Footer';
import * as amplitude from '@amplitude/analytics-browser';

interface Props {
  mode: ReviewMode;
}

/**
 * The dashboard that displays the user's plan.
 */
const Dashboard: React.FC<Props> = ({ mode }) => {
  // Redux setup.
  const user = useSelector(selectUser);
  const loginCheck = useSelector(selectLoginCheck);
  const searchStatus = useSelector(selectSearchStatus);
  const deletePlanStatus = useSelector(selectDeletePlanStatus);
  const addPlanStatus = useSelector(selectAddingPlanStatus);
  const deleteYearStatus = useSelector(selectDeleteYearStatus);
  const deleteCourseStatus = useSelector(selectCourseToDelete);
  const importingStatus = useSelector(selectImportingStatus);
  const courseInfoStatus = useSelector(selectShowCourseInfo);
  const addingPrereqStatus = useSelector(selectAddingPrereq);
  const cartStatus = useSelector(selectShowingCart);
  const experimentList = useSelector(selectExperimentList);
  const token = useSelector(selectToken);
  const dispatch = useDispatch();
  const currPlan = useSelector(selectPlan);
  const infoPopup = useSelector(selectInfoPopup);

  // State Setup
  const [showNotif, setShowNotif] = useState<boolean>(true);
  const [formPopup, setFormPopup] = useState<boolean>(false);

  const updateExperimentsForUser = useCallback(() => {
    axios
      .get(getAPI(window) + '/experiments/allExperiments')
      .then(async (experimentListResponse) => {
        const experiments = experimentListResponse.data.data;
        dispatch(setExperiments(experiments));
        for (const experiment of experiments) {
          if (experiment.active.includes(user._id)) {
            dispatch(toggleExperimentStatus(experiment._id));
          }
        }
      })
      .catch((errAllExperiments) => {
        console.log(errAllExperiments);
      });
  }, [dispatch, user._id]);

  useEffect(() => {
    updateExperimentsForUser();
  }, [experimentList.length, updateExperimentsForUser]);

  useEffect(() => {
    let unmounted = false;
    let source = axios.CancelToken.source();
    if (currPlan && currPlan._id !== 'noPlan') {
      axios
        .get(getAPI(window) + `/coursesByPlan/${currPlan._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((response) => {
          const sisCourses: SISRetrievedCourse[] = response.data.data;
          dispatch(updateCourseCache(sisCourses));
        })
        .catch((err) => {
          console.log(err);
        });
      userService
        .getThreads(currPlan._id, token, unmounted, source.token)
        .then((res) => {
          if (!res) {
            throw new Error('No response from server');
          }
          dispatch(updateThreads(res.data.data));
          const commentersSet = new Set<string>();
          for (const thread of res.data.data) {
            for (const comment of thread.comments) {
              const userId = comment.commenter_id;
              commentersSet.add(JSON.stringify(userId));
            }
          }
          const commentersArr = [...commentersSet].map((c) => JSON.parse(c));
          dispatch(updateCommenters(commentersArr));
        })
        .catch((err) => console.log(err));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currPlan._id]);

  return (
    <>
      {!loginCheck || importingStatus ? (
        <LoadingPage />
      ) : (
        <div className="flex flex-col w-full h-full min-h-screen bg-white">
          {formPopup && <FeedbackPopup setFormPopup={setFormPopup} />}
          {showNotif && (
            <FeedbackNotification
              actionHandler={setFormPopup}
              notifHandler={setShowNotif}
            />
          )}
          {/* <PlanEditMenu mode={mode} /> */}

          <Header
            userID={user._id}
            dashboardSwitchMode={DashboardMode.Planning}
            mode={mode}
            zLevelMax={
              addingPrereqStatus &&
              searchStatus &&
              deletePlanStatus &&
              addPlanStatus &&
              deleteYearStatus &&
              deleteCourseStatus &&
              courseInfoStatus &&
              cartStatus
            }
          />
          <Button
            sx={{
              position: 'fixed',
              padding: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
              fontWeight: '400',
              borderRadius: '0.5rem',
              zIndex: '90',
              top: '4.65rem',
              right: '2.25rem',
              outline: '2px solid transparent',
              outlineOffset: '2px',
              color: 'rgb(0 0 0 1)',
              backgroundColor: 'rgb(198, 232, 255, 1)',
              boxShadow:
                'var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)',
            }}
            className={clsx(
              'flex items-center p-2 text-base font-normal text-black rounded-lg z-[90] top-[4.65rem] right-9 focus:outline-none shadow-sm text-sm',
              {
                'fixed ': searchStatus,
                ' absolute': !searchStatus,
              },
            )}
            onClick={() => {
              dispatch(updateInfoPopup(!infoPopup));
              amplitude.track('Clicked Tracker');
            }}
          >
            <svg
              className="w-5 text-black plan-edit-menu mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              ></path>
            </svg>{' '}
            Tracker
          </Button>

          <div className="flex-grow w-full">
            <div className="flex flex-col w-full">
              <div className="flex flex-col pl-4 thin:flex-wrap-reverse mt-1 w-full h-full">
                <Actionbar mode={mode} />
                <CourseList mode={mode} />
              </div>
              <Footer />
              {infoPopup && <InfoMenu mode={mode} />}
            </div>
            {/* Global popups */}
            {addingPrereqStatus && <AddingPrereqPopup />}
            {searchStatus && <Search />}
            {deletePlanStatus && <DeletePlanPopup />}
            {addPlanStatus && !importingStatus && <PlanAdd />}
            {deleteYearStatus && <DeleteYearPopup />}
            {deleteCourseStatus && <DeleteCoursePopup />}
            {courseInfoStatus && <CourseDisplayPopup />}
            {cartStatus && <Cart />}
          </div>
        </div>
      )}
      {/* Dummy components used to generate state information */}
      <GenerateNewPlan />
      {mode === ReviewMode.Edit && <HandleUserInfoSetupDummy />}
      <HandlePlanShareDummy />
    </>
  );
};

export default Dashboard;
