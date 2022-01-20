import { FC, MouseEventHandler, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Select, {
  components,
  MultiValueProps,
  StylesConfig,
} from 'react-select';
import { api } from '../../../resources/assets';
import {
  selectPlan,
  updateSelectedPlan,
} from '../../../slices/currentPlanSlice';
import { updateDeletePlanStatus } from '../../../slices/popupSlice';
import {
  selectPlanList,
  selectUser,
  updatePlanList,
} from '../../../slices/userSlice';
import PlanChoose from './PlanChoose';
import { ReactComponent as RemoveSvg } from '../../../resources/svg/Remove.svg';
import { ReactComponent as AddSvg } from '../../../resources/svg/Add.svg';
import axios from 'axios';
import { Year, Plan } from '../../../resources/commonTypes';
import ReactTooltip from 'react-tooltip';
import clsx from 'clsx';
import {
  selectExperimentList,
  selectExperimentIDs,
} from '../../../slices/experimentSlice';
import { allMajors } from '../../../resources/majors';

const majorOptions = allMajors.map((major, index) => ({
  value: index,
  label: major.degree_name,
}));

/**
 * @description ActionBar component
 */
const ActionBar: FC<{
  dropdown: boolean;
  setDropdown: Function;
  onShareClick: MouseEventHandler<HTMLButtonElement>;
}> = ({ dropdown, setDropdown, onShareClick }) => {
  // Redux Setup
  const dispatch = useDispatch();
  const currentPlan = useSelector(selectPlan);
  const planList = useSelector(selectPlanList);
  const user = useSelector(selectUser);

  // Holds temporary plan name.
  const [planName, setPlanName] = useState<string>(currentPlan.name);

  // Determines whether we're editing the name.
  const [editName, setEditName] = useState<boolean>(false);

  // Gets Experiment List and Experiment Names
  const experimentList = useSelector(selectExperimentList);
  const experimentIDs = useSelector(selectExperimentIDs);

  const redButtonID = '61e606029d072ea10d4a92c0';
  const redButtonIdx = experimentIDs.indexOf(redButtonID);
  const redButton =
    experimentList.length > 0 && redButtonIdx !== -1
      ? experimentList[redButtonIdx]
      : null;

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
  }, [currentPlan]);

  /**
   * Updates temporary plan name and notifies useffect on state change to update db plan name with debounce.
   * @param event
   */
  const handlePlanNameChange = (event: any): void => {
    setPlanName(event.target.value);
    setEditName(true);
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
      .patch(api + '/plans/update', body)
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

  const updateName = (): void => {
    const body = {
      plan_id: currentPlan._id,
      majors: currentPlan.majors,
      name: planName,
    };
    fetch(api + '/plans/update', {
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

  // Activates delete plan popup.
  const activateDeletePlan = (): void => {
    dispatch(updateDeletePlanStatus(true));
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
        .post(api + '/years', body)
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

  useEffect(() => {
    ReactTooltip.rebuild();
  });

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

  /**
   * Limit the max width of multi-select labels
   */
  const customStyles: StylesConfig<typeof majorOptions[number], true> = {
    multiValue: (provided) => {
      const maxWidth = '17rem';
      return { ...provided, maxWidth };
    },
  };

  return (
    <div
      className={clsx(
        'flex flex-row px-2 py-1 rounded shadow overflow-x-auto drop-shadow-md sticky top-0 z-20',
        {
          'bg-red-100': redButton !== null ? redButton.active : false,
          'bg-white': redButton !== null ? !redButton.active : true,
        },
      )}
    >
      <div className="flex flex-row px-2 py-1 bg-white rounded shadow drop-shadow-md sticky top-0 z-20">
        <PlanChoose dropdown={dropdown} setDropdown={setDropdown} />
        <div className="flex flex-row items-end mr-2 my-1 h-10 border bg-white border-gray-300 rounded shadow">
          <div className="text-xl m-auto ml-2 mr-0">✎</div>
          <input
            value={planName}
            className=" my-0.5 px-1 w-80 h-8 text-gray-800 text-lg outline-none"
            onChange={handlePlanNameChange}
          />
        </div>
        <div
          className="flex mr-2 my-1 px-2 font-light text-lg w-80"
          style={{ width: '25rem' }}
        >
          <form data-testid="major-change-form" className="z-50 w-full">
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
        </div>
        <button
          className="flex flex-row items-center ml-1 mr-2 my-1 px-2 h-10 hover:underline hover:bg-red-300 border border-gray-300 rounded shadow transition duration-200 ease-in"
          onClick={activateDeletePlan}
        >
          <RemoveSvg className="my-auto w-5 stroke-2 cursor-pointer select-none transform hover:scale-110 transition duration-200 ease-in" />{' '}
          <div className="ml-1">Delete</div>
        </button>
        <button
          className="flex flex-row items-center ml-1 mr-2 my-1 px-2 h-10 hover:underline hover:bg-green-300 border border-gray-300 rounded shadow transition duration-200 ease-in"
          onClick={onShareClick}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6 transform hover:scale-110 transition duration-200 ease-in"
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
        <div className="flex flex-row items-center my-1 w-10 h-10 hover:underline hover:bg-green-300 border border-gray-300 rounded focus:outline-none shadow cursor-pointer transition duration-200 ease-in">
          <AddSvg
            onClick={() => addNewYear(false)}
            data-tip={`Add a new year!`}
            data-for="godTip"
            className="w-10 h-10 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
