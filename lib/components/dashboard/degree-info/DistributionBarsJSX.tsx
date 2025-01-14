import React, { FC, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCourse } from '../../../resources/assets';
import {
  Plan,
  Major,
  Course,
  UserCourse,
} from '../../../resources/commonTypes';
import {
  selectDistributions,
  selectPlan,
  selectCurrentPlanCourses,
  updateDistributions,
  selectTotalCredits,
} from '../../../slices/currentPlanSlice';
import { selectCourseCache } from '../../../slices/userSlice';
import CourseBar from './CourseBar';
import {
  checkRequirementSatisfied,
  getRequirements,
  requirements,
} from './distributionFunctions';

const DistributionBarsJSX: FC<{ major: Major }> = ({ major }) => {
  const dispatch = useDispatch();
  const distributions = useSelector(selectDistributions);
  const currentPlan: Plan = useSelector(selectPlan);
  const courseCache = useSelector(selectCourseCache);
  const currPlanCourses = useSelector(selectCurrentPlanCourses);
  const totalCredits = useSelector(selectTotalCredits);
  const [calculated, setCalculated] = useState<boolean>(false);
  const [distributionBarsJSX, setDistributionBarsJSX] = useState<JSX.Element[]>(
    [],
  );
  const [retrievedDistributions, setDistributions] = useState<{
    plan: Plan;
    distr: [string, requirements[]][];
  }>({ plan: currentPlan || currentPlan, distr: [] });
  const [showDistributions] = useState<boolean[]>(
    new Array(distributions.length),
  );

  // Gets distribution everytime a plan changes.
  useEffect(() => {
    const distr = getDistributions();
    if (distr && distr.length > 0) {
      let tot = 0;
      currentPlan.years.forEach((year) => {
        tot += year.courses.length;
      });
      updateFulfilled(
        currentPlan,
        distr,
        tot === currPlanCourses.length ? currPlanCourses : [],
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [major, currPlanCourses]);

  useEffect(() => {
    setCalculated(true);
    if (currentPlan._id === retrievedDistributions.plan._id) {
      dispatch(updateDistributions(retrievedDistributions.distr));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retrievedDistributions]);

  // Update displayed JSX every time distributions get updated.
  useEffect(() => {
    const distributionJSX = distributions.map(
      (pair: [string, requirements[]], i: number) => {
        let completed = true;
        for (let req of pair[1]) {
          if (!checkReqCompleted(req)) {
            completed = false;
            break;
          }
        }
        return (
          <div key={pair[0] + pair[1] + i}>
            <div key={pair[1][0].name + 0 + pair[1][0].expr}>
              <CourseBar
                distribution={pair[1][0]}
                general={true}
                bgcolor={'skyblue'}
                completed={completed}
              />
            </div>
          </div>
        );
      },
    );
    distributionJSX.unshift(
      <div key={'total'}>
        <div key={'total' + 0 + 'total'}>
          <CourseBar
            distribution={{
              name: 'Total Credits',
              expr: '',
              required_credits: major !== null ? major.total_degree_credit : 0,
              fulfilled_credits: totalCredits,
              description:
                major !== null
                  ? 'This is the total amount of credits that is required for ' +
                    major.degree_name
                  : '',
            }}
            completed={
              totalCredits >= (major !== null ? major.total_degree_credit : 0)
            }
            general={true}
            bgcolor=""
          />
        </div>
      </div>,
    );
    setDistributionBarsJSX(distributionJSX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distributions, showDistributions]);

  const checkReqCompleted = (req: requirements) => {
    if (
      req.fulfilled_credits < req.required_credits ||
      (req.required_credits === 0 && req.fulfilled_credits === 0)
    ) {
      return false;
    }
    return true;
  };

  /**
   * Gets all distributions associated with current plan
   * @returns an array of pairs for distributions and their requirements if distributions exist and null if they don't
   */
  const getDistributions = (): [string, requirements[]][] | null => {
    if (major) {
      return getRequirements(major);
    }
    return null;
  };
  /**
   * args: an array containing focus areas and their associated requirements, and all courses
   * updates the requirements obj so that the fulfilled credits accurately reflects the plan
   * @param requirements - an array of requirement pairs
   * @param courses
   * @param courseCache - cached courses
   * @param currPlanCourses - courses in current plan
   */
  const updateFulfilled = (
    updatingPlan: Plan,
    reqs: [string, requirements[]][],
    courses: UserCourse[],
  ) => {
    setDistributions({ plan: updatingPlan, distr: reqs });
    const coursesCopy: UserCourse[] = [...courses];
    coursesCopy.sort((c1: UserCourse, c2: UserCourse) => {
      const c1Split = c1.number.split('.');
      const c2Split = c2.number.split('.');
      const c1LastNum = c1Split[c1Split.length - 1];
      const c2LastNum = c2Split[c2Split.length - 1];
      if (c1LastNum === '' && c1Split.length === 1) {
        return -1;
      } else if (c2LastNum === '' && c2Split.length === 1) {
        return 1;
      } else {
        return parseInt(c1LastNum) - parseInt(c2LastNum);
      }
    });
    processCoursesCopy(courses, coursesCopy, reqs, updatingPlan);
  };

  const processCoursesCopy = async (
    courses: UserCourse[],
    coursesCopy: UserCourse[],
    reqs: [string, requirements[]][],
    updatingPlan: Plan,
  ) => {
    let reqCopy: [string, requirements[]][] = copyReqs(reqs);
    let count: number = 0;
    const checked: Course[] = [];
    for (let course of coursesCopy) {
      setCalculated(false);
      const courseObj = await getCourse(
        course.number,
        courseCache,
        courses,
        -1,
      );
      let counted: boolean = false;
      if (courseObj.resp !== null) {
        checked.forEach((c) => {
          if (courseObj.resp !== null && c.number === courseObj.resp.number)
            counted = true;
        });
        checked.push(courseObj.resp);
      } else if (course.number === 'placeholder') {
        const resp: Course = {
          title: '',
          number: course.number,
          areas: course.area,
          term: course.term,
          school: '',
          department: course.department,
          credits: course.credits.toString(),
          wi: course.wi,
          bio: '',
          tags: course.tags,
          preReq: course.preReq,
          restrictions: [],
          version: course.version,
          level: course.level,
        };
        courseObj.resp = resp;
        checked.push(courseObj.resp);
      }
      const localReqCopy: [string, requirements[]][] = copyReqs(reqCopy);
      if (!counted) updateReqs(localReqCopy, courseObj.resp);
      reqCopy = localReqCopy;
      count++;
      if (count === courses.length) {
        setDistributions({ plan: updatingPlan, distr: reqCopy });
      }
    }
  };

  const updateReqs = (reqs: [string, requirements[]][], courseObj) => {
    // double_count check:
    // If double_count is undefined, the course may only count for one distribution
    // If double_count is string[], the specified distributions / fine requirements are 'whitelisted'
    // If double_count is ['All'], the course may double count freely
    if (!courseObj) return;
    let distDoubleCount: string[] | undefined = ['All'];
    reqs.forEach((reqGroup, i) => {
      let req = reqGroup[1][0]; // general distribution
      // if course satisfies distribution:
      if (
        distDoubleCount &&
        (distDoubleCount.includes(req.name) ||
          distDoubleCount.includes('All')) &&
        checkRequirementSatisfied(req, courseObj)
      ) {
        // update credit only if credit requirement not met
        if (
          req.fulfilled_credits < req.required_credits ||
          (req.required_credits === 0 && req.fulfilled_credits === 0)
        ) {
          reqs[i][1][0].fulfilled_credits += parseInt(courseObj.credits);
          distDoubleCount = req.double_count; // set double_count, if any
        }
        // for each fine req, see if course satisfies fine requirements
        processFines(reqs, courseObj, i);
      }
    });
    // Pathing check
    reqs.forEach((reqGroup: [string, requirements[]]) =>
      reqGroup[1].forEach((req: requirements) => {
        processReq(req, reqGroup);
      }),
    );
  };

  const processFines = (
    reqs: [string, requirements[]][],
    courseObj,
    i: number,
  ) => {
    let fineDoubleCount: string[] | undefined = ['All'];
    // for each fine req
    reqs[i][1].forEach((req: requirements, j: number) => {
      if (j !== 0) {
        // skip general distribution, not fine req
        let fineReq = reqs[i][1][j];
        // if course satisfies fine requirement
        if (
          fineDoubleCount &&
          (fineDoubleCount.includes(fineReq.name) || // check if fine req can be double counted
            fineDoubleCount.includes('All')) &&
          (fineReq.fulfilled_credits < fineReq.required_credits ||
            (fineReq.required_credits === 0 &&
              fineReq.fulfilled_credits === 0) || // check if fine req is already fulfilled
            !checkReqCompleted(fineReq)) &&
          checkRequirementSatisfied(fineReq, courseObj) // check if course satisfies fine req
        ) {
          // update fine requirements
          reqs[i][1][j].fulfilled_credits += parseInt(courseObj.credits);
          fineDoubleCount = fineReq.double_count;
        }
      }
    });
  };

  const processReq = (
    req: requirements,
    reqGroup: [string, requirements[]],
  ) => {
    if (req.pathing) {
      let numPaths = req.pathing;
      let [requirement, ...paths] = reqGroup[1];
      let satisfiedFineRequirements = [requirement];
      for (let path of paths) {
        if (path.fulfilled_credits >= path.required_credits) {
          satisfiedFineRequirements.push(path);
          numPaths -= 1;
        }
      }
      if (numPaths <= 0) {
        reqGroup[1] = satisfiedFineRequirements;
      }
    }
  };

  const copyReqs = (reqs) => {
    const reqCopy: [string, requirements[]][] = [];
    reqs.forEach((reqGroup) => {
      const reqGroupCopy: any = [];
      reqGroup[1].forEach((req) => reqGroupCopy.push({ ...req }));
      reqCopy.push([reqGroup[0], reqGroupCopy]);
    });
    return reqCopy;
  };
  return (
    <div>
      {calculated ? (
        <>{distributionBarsJSX}</>
      ) : (
        <b className="m-10 h-full w-96 bg-blue-100">
          Loading degree progress...
        </b>
      )}
    </div>
  );
};

export default DistributionBarsJSX;
