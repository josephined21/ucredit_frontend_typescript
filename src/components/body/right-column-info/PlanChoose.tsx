import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plan } from "../../commonTypes";
import { useDispatch, useSelector } from "react-redux";
import {
  updatePlanList,
  updateAddingStatus,
  selectUser,
  selectPlanList,
  selectAddingStatus,
} from "../../slices/userSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GenerateNewPlan from "./GenerateNewPlan";
import PlanAdd from "../PlanAdd";
import { selectPlan, updateSelectedPlan } from "../../slices/currentPlanSlice";
import { api } from "../../assets";

/**
 * Dropdown for choosing a plan to display.
 */
const PlanChoose = () => {
  // Redux setup
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const currentPlan = useSelector(selectPlan);
  const planList = useSelector(selectPlanList);
  const adding = useSelector(selectAddingStatus);

  const [dropdown, setDropdown] = useState<boolean>(false);
  const openSelectDropdown = () => {
    setDropdown(!dropdown);
  };

  const [generateNew, setGenerateNew] = useState<boolean>(false);
  const setGenerateNewFalse = () => {
    setGenerateNew(false);
  };

  // Gets all users's plans and updates state everytime a new user is chosen.
  useEffect(() => {
    if (user._id !== "noUser" && user._id !== "guestUser") {
      axios
        .get(api + "/plansByUser/" + user._id)
        .then((retrieved) => {
          const retrievedPlans: Plan[] = retrieved.data.data;
          if (retrievedPlans.length > 0) {
            // sort plans by ids if there is more than one plan
            retrievedPlans.sort((plan1: Plan, plan2: Plan) =>
              plan1._id.localeCompare(plan2._id)
            );
          }

          if (currentPlan._id !== "noPlan") {
            // Swap first plan in the list with the current plan.
            retrievedPlans.forEach((plan: Plan, index) => {
              if (plan._id === currentPlan._id) {
                const temp = retrievedPlans[0];
                retrievedPlans[0] = currentPlan;
                retrievedPlans[index] = temp;
              }
            });
          }

          if (retrievedPlans.length > 0 && currentPlan._id === "noPlan") {
            const totPlans: Plan[] = [];
            retrievedPlans.forEach((plan) => {
              axios
                .get(api + "/years/" + plan._id)
                .then((resp) => {
                  totPlans.push({ ...plan, years: resp.data.data });
                  if (totPlans.length === retrievedPlans.length) {
                    // Initial load, there is no current plan, so we set the current to be the first plan in the array.
                    dispatch(updatePlanList(totPlans));
                    dispatch(updateSelectedPlan(totPlans[0]));
                  }
                })
                .catch((err) => console.log(err));
            });

            toast("Retrieved " + retrievedPlans.length + " plans!", {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: 0,
            });
          } else if (
            retrievedPlans.length === 0 &&
            user._id !== "noUser" &&
            user._id !== "guestUser"
          ) {
            // If no plans, automatically generate a new plan
            dispatch(updateAddingStatus(true));
          } else {
            // If there is already a current plan, simply update the plan list.
            dispatch(updatePlanList(retrievedPlans));
          }
        })
        .catch((err) => {
          if (user._id === "guestUser") {
            console.log(
              "In guest user! This is expected as there are no users with this id."
            );
          } else {
            console.log(err);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  // Handles onClick for when a dropdown option is selected
  const handlePlanChange = (event: any) => {
    setDropdown(false);
    const selectedOption = event.target.value;
    const planListClone = [...planList];
    if (selectedOption === "new plan" && user._id !== "noUser") {
      dispatch(updateAddingStatus(true));
    } else {
      let newSelected: Plan = currentPlan;
      planList.forEach((plan, index) => {
        if (plan._id === event.target.value) {
          newSelected = plan;
          planListClone.splice(index, 1);
          planListClone.splice(0, 0, newSelected);
        }
      });

      toast(newSelected.name + " selected!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: 0,
      });
      dispatch(updateSelectedPlan(newSelected));
      dispatch(updatePlanList(planListClone));
    }
  };

  // Adds a new plan every time a new guest user is created and they don't have a a plan.
  useEffect(() => {
    if (user.plan_ids.length === 0 && user._id === "guestUser") {
      // Post req body for a new plan
      dispatch(updateAddingStatus(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user._id]);

  return (
    <>
      {/* dummy component to generate new plans */}
      <GenerateNewPlan
        generateNew={generateNew}
        setGenerateNewFalse={setGenerateNewFalse}
      />
      <button
        className="text-white bg-primary rounded"
        onClick={openSelectDropdown}
      >
        Select Plan
      </button>
      {dropdown ? (
        <div className="flex flex-col text-white bg-secondary">
          {planList.map((plan, index) => (
            <button key={index} value={plan._id} onClick={handlePlanChange}>
              {plan.name}
            </button>
          ))}
          <button value="new plan" onClick={handlePlanChange}>
            Create a plan +
          </button>
        </div>
      ) : null}
      {adding ? <PlanAdd setGenerateNew={setGenerateNew} /> : null}
    </>
  );
};

export default PlanChoose;
