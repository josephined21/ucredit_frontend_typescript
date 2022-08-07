import axios from 'axios';
import React, { FC, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { getAPI } from '../../resources/assets';
import { ReviewMode, Year, Plan } from '../../resources/commonTypes';
import { allMajors } from '../../resources/majors';
import {
  selectPlan,
  updateSelectedPlan,
  updateCurrentPlanCourses,
} from '../../slices/currentPlanSlice';
import {
  selectInfoPopup,
  updateAddingPlanStatus,
  updateDeletePlanStatus,
  updateInfoPopup,
} from '../../slices/popupSlice';
import { selectSearchStatus } from '../../slices/searchSlice';
import {
  selectPlanList,
  selectUser,
  selectReviewMode,
  updatePlanList,
} from '../../slices/userSlice';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { TrashIcon } from '@heroicons/react/outline';
import { PlusIcon } from '@heroicons/react/solid';
import Fab from '@mui/material/Fab';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Menu from '@mui/material/Menu';
import Reviewers from './menus/reviewers/Reviewers';
import { clsx } from 'clsx';

const majorOptions = allMajors.map((major) => ({
  abbrev: major.abbrev,
  name: major.degree_name,
}));

const Actionbar: FC<{ mode: ReviewMode }> = ({ mode }) => {
  const planList = useSelector(selectPlanList);
  const currentPlan = useSelector(selectPlan);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const infoPopup = useSelector(selectInfoPopup);
  const reviewMode = useSelector(selectReviewMode);
  const [planName, setPlanName] = useState<string>(currentPlan.name);
  const [editName, setEditName] = useState<boolean>(false);
  const [openEdit, setOpenEdit] = useState<boolean>(false);
  const searchStatus = useSelector(selectSearchStatus);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

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

  const handlePlanChange = (event, newValue) => {
    if (!newValue.value || !newValue.value.name) return;
    if (newValue.label === 'Create New Plan' && user._id !== 'noUser') {
      dispatch(updateAddingPlanStatus(true));
    } else {
      toast(newValue.value.name + ' selected!');
      if (currentPlan._id !== newValue.value._id)
        dispatch(updateCurrentPlanCourses([]));
      dispatch(updateSelectedPlan(newValue.value));
    }
  };

  /**
   * Updates temporary plan name and notifies useffect on state change to update db plan name with debounce.
   * @param event
   */
  const handlePlanNameChange = (event) => {
    setPlanName(event.target.value);
    setEditName(true);
  };

  const handleMajorChange = (event, newValues) => {
    if (newValues.length === 0) {
      toast.error('You must have at least one major!');
      return;
    }

    const newMajors = newValues.map((option) => option.label);
    console.log(newMajors);
    const body = {
      plan_id: currentPlan._id,
      majors: newMajors,
    };
    axios
      .patch(getAPI(window) + '/plans/update', body)
      .then(() => {
        const newUpdatedPlan = { ...currentPlan, majors: newMajors };
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

  const getCurrentMajors = (): { label: string; value: string }[] => {
    const currentMajorOptions: { label: string; value: string }[] = [];
    majorOptions.forEach((major, i) => {
      if (currentPlan.majors.includes(major.name))
        currentMajorOptions.push({ label: major.name, value: major.abbrev });
    });
    return currentMajorOptions;
  };

  const getLimitText = (): string => {
    let outString = '';
    const currMajors = getCurrentMajors();

    currMajors.forEach((major, i) => {
      if (i < 2) {
        outString += major.value;
        if (i < currMajors.length - 1) outString += ', ';
      }
    });
    outString += currMajors.length > 2 ? ` +${currMajors.length - 2} more` : '';
    return outString;
  };

  // Activates delete plan popup.
  const activateDeletePlan = (): void => {
    dispatch(updateDeletePlanStatus(true));
  };

  /**
   * Handles when button for shareable link is clicked.
   */
  const onShareClick = (): void => {
    const shareableURL =
      window.location.origin + '/share?_id=' + currentPlan._id;
    navigator.clipboard.writeText(shareableURL).then(() => {
      navigator.clipboard.writeText(shareableURL).then(() => {
        toast.info('Share link copied to Clipboard!');
      });
    });
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
    <div className="flex flex-row flex-wrap">
      {reviewMode === ReviewMode.Edit && (
        <>
          <Fab
            color="info"
            aria-label="edit"
            onClick={() => setOpenEdit(true)}
            className="mr-2 my-3 shadow-none bg-blue-200 text-blue-600 my-auto"
            size="small"
          >
            <EditIcon />
          </Fab>
          <Dialog
            open={openEdit}
            onClose={() => setOpenEdit(false)}
            closeAfterTransition={false}
          >
            <DialogTitle>Edit Plan Name</DialogTitle>
            <TextField
              id="outlined-basic"
              label="Plan Name"
              variant="outlined"
              className="m-4"
              onChange={handlePlanNameChange}
              value={planName}
            />
          </Dialog>
          <Autocomplete
            disablePortal
            id="combo-box-demo"
            options={[
              { value: null, label: 'Create New Plan' },
              ...planList
                .filter((plan) => plan._id !== currentPlan._id)
                .map((plan) => ({ value: plan, label: plan.name })),
            ]}
            sx={{ width: 280 }}
            renderInput={(params) => (
              <TextField {...params} label="Select/Create Plan" />
            )}
            onChange={handlePlanChange}
            value={{
              label: currentPlan.name,
              value: currentPlan,
            }}
            size="small"
            className="mr-2 my-3"
            isOptionEqualToValue={(o1, o2) => {
              if (!o1.value || !o2.value || !o1.value.name || !o2.value.name)
                return true;
              else return o1.value._id === o2.value._id;
            }}
          />
          <Autocomplete
            disablePortal
            multiple
            id="combo-box-demo"
            options={majorOptions.map((option, i) => ({
              label: option.name,
              value: option.abbrev,
            }))}
            sx={{ width: 300 }}
            renderInput={(params) => (
              <TextField {...params} label="Update Degrees" />
            )}
            onChange={handleMajorChange}
            value={getCurrentMajors()}
            size="small"
            className="mr-2 important-nowrap my-3"
            limitTags={0}
            isOptionEqualToValue={(o1, o2) => o1.label === o2.label}
            disableCloseOnSelect
            getLimitTagsText={() => (
              <div className="text-sm text-ellipsis whitespace-nowrap">
                {getLimitText()}
              </div>
            )}
          />
        </>
      )}
      <Button
        variant="outlined"
        onClick={onShareClick}
        className="mr-2 my-3 h-10"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 transition duration-200 ease-in transform hover:scale-110 mb-0.5"
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
      </Button>
      {reviewMode === ReviewMode.Edit && (
        <>
          <Button
            onClick={activateDeletePlan}
            variant="outlined"
            color="error"
            className="mr-2 my-3 h-10"
          >
            <TrashIcon className="w-5 mb-0.5 transition duration-200 ease-in transform cursor-pointer select-none stroke-2 hover:scale-110 mr-1" />{' '}
            Delete Plan
          </Button>
          <Button
            onClick={() => addNewYear(false)}
            className="mr-2 my-3 h-10"
            variant="outlined"
            color="success"
          >
            <PlusIcon className="w-5 h-5 mb-0.5 focus:outline-none" />
            <div className="w-full ml-1">{' Add Year'}</div>
          </Button>
          <div>
            <Button
              className="mr-2 h-10 my-3 bg-blue-100"
              onClick={handleClick}
            >
              Reviewers
            </Button>
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={openMenu}
              onClose={handleClose}
              MenuListProps={{
                'aria-labelledby': 'basic-button',
              }}
              className="px-2"
            >
              <Reviewers />
            </Menu>
          </div>
        </>
      )}
      <Button
        className={clsx(
          'flex items-center p-2 text-base font-normal text-black rounded-lg  z-20 top-20 right-9 focus:outline-none bg-blue-100 shadow-sm text-sm',
          {
            'fixed ': searchStatus,
            ' absolute': !searchStatus,
          },
        )}
        onClick={() => {
          dispatch(updateInfoPopup(!infoPopup));
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
    </div>
  );
};

export default Actionbar;
