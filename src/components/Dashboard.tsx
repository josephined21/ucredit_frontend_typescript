import React from "react";
import Header from "./header/Header";
import Content from "./body/Content";
import { ToastContainer } from "react-toastify";
import UserSection from "./header/UserSection";

const Dashboard = (props: any) => {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="fixed z-20 p-3 medium:px-48 w-full h-header bg-primary shadow">
        <UserSection cookie={props.cookie} />
      </div>
      <Content />

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default Dashboard;
