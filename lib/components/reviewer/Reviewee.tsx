import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import clsx from 'clsx';
import { ClipboardListIcon, EyeIcon } from '@heroicons/react/outline';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import {
  Plan,
  ReviewRequestStatus,
  StatusPlan,
  User,
} from '../../resources/commonTypes';
import { Hoverable } from '../utils';
import { TooltipPrimary } from '../utils/TooltipPrimary';
import { statusReadable } from '../../../pages/reviewer';
import { userService } from '../../services';
import PlanSummary from './PlanSummary';
import {
  updateCurrentPlanCourses,
  updateSelectedPlan,
} from '../../slices/currentPlanSlice';
import { useDispatch } from 'react-redux';
import Dropdown from './Dropdown';

interface Props {
  userId: string;
  plans: StatusPlan[];
  reviewee: User;
  expanded?: boolean;
  setRefreshReviews: Dispatch<SetStateAction<boolean>>;
}

const dropdownOptions = [
  {
    label: 'UNDERREVIEW',
    content: <p className="text-sky-500">Under Review</p>,
  },
  {
    label: 'APPROVED',
    content: <p className="text-emerald-500">Approved</p>,
  },
  {
    label: 'REJECTED',
    content: <p className="text-red-500">Rejected</p>,
  },
];

const Reviewee: React.FC<Props> = ({
  plans,
  reviewee,
  expanded = false,
  setRefreshReviews,
}) => {
  const [showPlans, setShowPlans] = useState(expanded);
  const [majors, setMajors] = useState<string[]>([]);
  const [notifState, setNotifState] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const set = new Set<string>();
    for (const p of plans) {
      for (const m of p.majors) set.add(m);
    }
    setMajors([...set]);
  }, [plans]);

  const handleViewPlan = async (e, plan: Plan) => {
    e.stopPropagation();
    router.push(`/dashboard?plan=${plan._id}&mode=view`);
  };
  return (
    reviewee && (
      <div className="w-full p-3 bg-white border border-gray-300 rounded-md">
        <div
          className="flex justify-between mb-2"
          onClick={() => setShowPlans(!showPlans)}
        >
          <div>
            <p className="font-semibold">{reviewee.name}</p>
            <p>{reviewee.email}</p>
          </div>
          <p className="flex items-center">{reviewee.grade}</p>
        </div>
        <div className={clsx('text-sm', { 'mb-2': showPlans })}>
          {majors.map((m) => (
            <p key={m}>{m}</p>
          ))}
        </div>
        {showPlans && (
          <div className="divide-y">
            {plans.map((p) => {
              const { _id, name, status, review_id } = p;
              return (
                <div key={_id}>
                  <PlanSummary
                    plan={p}
                    notifState={notifState}
                    setNotifState={setNotifState}
                    review_id={review_id}
                    setRefreshReviews={setRefreshReviews}
                  />
                  <div className="flex items-center justify-between h-8 group">
                    <div className="flex items-center gap-[6px]">
                      {status && (
                        <Hoverable
                          as={
                            <div
                              className={clsx(
                                'w-2 h-2 translate-y-[1.5px] rounded-full',
                                {
                                  'bg-sky-500':
                                    status === ReviewRequestStatus.UnderReview,
                                  'bg-emerald-500':
                                    status === ReviewRequestStatus.Approved,
                                  'bg-red-500':
                                    status === ReviewRequestStatus.Rejected,
                                },
                              )}
                            />
                          }
                        >
                          {({ hovered }) =>
                            hovered && (
                              <TooltipPrimary width={140}>
                                {statusReadable[status]}
                              </TooltipPrimary>
                            )
                          }
                        </Hoverable>
                      )}
                      <p>{name}</p>
                    </div>
                    <div className="flex items-center gap-x-1">
                      <Dropdown
                        width={180}
                        options={dropdownOptions}
                        onChange={async (values) => {
                          const value = values[0];
                          if (!value) return;
                          try {
                            await userService.changeReviewStatus(
                              review_id,
                              value.label,
                            );
                            setRefreshReviews(true);
                            toast.success(
                              `Status changed to ${
                                statusReadable[value.label]
                              }`,
                            );
                          } catch (e) {
                            console.log(e);
                          }
                        }}
                        _default={status}
                      />
                      <Hoverable
                        as={
                          <div
                            className="flex items-center justify-center w-6 h-6 transition-colors duration-150 ease-in rounded-sm cursor-pointer hover:bg-gray-200 inspect-plan-button"
                            onClick={(e) => handleViewPlan(e, p)}
                          >
                            <EyeIcon className="w-5 h-5" />
                          </div>
                        }
                      >
                        {({ hovered }) =>
                          hovered && (
                            <TooltipPrimary width={120}>
                              Inspect plan
                            </TooltipPrimary>
                          )
                        }
                      </Hoverable>
                      <Hoverable
                        as={
                          <button
                            className="flex items-center justify-center w-6 h-6 transition-colors duration-150 ease-in rounded-sm cursor-pointer hover:bg-gray-200 view-summary-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotifState(!notifState);
                              dispatch(updateSelectedPlan(p));
                              let allCourses = [];
                              p.years.forEach((y) => {
                                allCourses = [...allCourses, ...y.courses];
                              });
                              dispatch(updateCurrentPlanCourses(allCourses));
                            }}
                          >
                            <ClipboardListIcon className="w-5 h-5"></ClipboardListIcon>
                          </button>
                        }
                      >
                        {({ hovered }) =>
                          hovered && (
                            <TooltipPrimary width={120}>
                              View Summary
                            </TooltipPrimary>
                          )
                        }
                      </Hoverable>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )
  );
};

export { Reviewee };
