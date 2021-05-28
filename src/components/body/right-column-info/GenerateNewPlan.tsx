import React, { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Plan } from "../../commonTypes";
import {
  updatePlanList,
  selectUser,
  selectPlanList,
  updateGuestPlanIds,
  selectToAddName,
} from "../../slices/userSlice";
import { testMajorCSNew } from "../../testObjs";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updateSelectedPlan } from "../../slices/currentPlanSlice";

const api = "https://ucredit-api.herokuapp.com/api";

type generateNewPlanProps = {
  generateNew: boolean;
  setGenerateNewFalse: Function;
  _id?: String;
  currentPlan?: Plan;
};

/**
 * Reusable component that generates a new empty plan.
 */
const GenerateNewPlan: React.FC<generateNewPlanProps> = (props) => {
  const dispatch = useDispatch();

  const user = useSelector(selectUser);
  const planList = useSelector(selectPlanList);
  const toAddName = useSelector(selectToAddName);

  useEffect(() => {
    if (props.generateNew === false) return;

    const planBody = {
      name: "Unnamed Plan",
      user_id: user._id,
      majors: [testMajorCSNew.name],
      expireAt:
        user._id === "guestUser" ? Date.now() + 60 * 60 * 24 * 1000 : null,
    };

    if (toAddName !== planBody.name) {
      planBody.name = toAddName;
    }

    let newPlan: Plan;
    axios
      .post(api + "/plans", planBody)
      .then((response: any) => {
        newPlan = response.data.data;

        // Make a new distribution for each distribution of the major of the plan.
        testMajorCSNew.distributions.forEach((distr: any, index: number) => {
          const distributionBody = {
            name: distr.name,
            required: distr.required,
            user_id: user._id,
            plan_id: newPlan._id,
            filter: distr.filter,
            expireAt:
              user._id === "guestUser"
                ? Date.now() + 60 * 60 * 24 * 1000
                : null,
          };

          axios
            .post(api + "/distributions", distributionBody)
            .then((newDistr: any) => {
              newPlan = {
                ...newPlan,
                distribution_ids: [
                  ...newPlan.distribution_ids,
                  newDistr.data.data._id,
                ],
              };
            })
            .then(() => {
              // After making our last distribution, we update our redux stores.
              if (index === testMajorCSNew.distributions.length - 1) {
                dispatch(updateSelectedPlan(newPlan));
                dispatch(updatePlanList([newPlan, ...planList]));
                props.setGenerateNewFalse();
                toast.success(newPlan.name + " created!", {
                  position: "top-right",
                  autoClose: 5000,
                  hideProgressBar: true,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  progress: undefined,
                });
                if (user._id === "guestUser") {
                  const planIdArray = [newPlan._id];
                  dispatch(updateGuestPlanIds(planIdArray));
                }
              }
            });
        });
      })
      .catch((e) => {
        console.log(e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.generateNew]);

  return <div></div>;
};

export default GenerateNewPlan;
