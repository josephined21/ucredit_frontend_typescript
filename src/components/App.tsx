import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import { Switch, Route, useHistory } from "react-router-dom";
import Dashboard from "./Dashboard";
import DashboardEntry from "./DashboardEntry";
import bird from "./birdTempGif.gif";
import { useCookies, withCookies } from "react-cookie";
//import { Counter } from '../redux_sample/Counter';

/* 
  Root app component.
*/
function App(props: any) {
  const [welcomeScreen, setWelcomeScreen] = useState<boolean>(true);
  useEffect(() => {
    setTimeout(() => setWelcomeScreen(false), 1500);
  }, []);

  // Component state setup
  const [cookies, setCookies] = useState(props.cookies);
  const [authCookies, setAuthCookie] = useCookies(["connect.sid"]);
  const [cookieUpdate, setCookieUpdate] = useState<boolean>(true);
  let history = useHistory();

  // Creates a cookie based on url.
  const createCookie = (token: string) => {
    if (!token.includes("dashboard")) {
      setAuthCookie("connect.sid", token, { path: "/" });
      setCookies(props.cookies);
      setCookieUpdate(!cookieUpdate);
      history.push("/");
    }
  };
  return (
    <>
      {welcomeScreen ? (
        <div className="absolute z-50 top-0 flex flex-col m-auto w-screen h-screen text-center text-center text-white bg-primary">
          Welcome logo animation (to be replaced)
          <img className="mt-auto mx-auto" src={bird} alt={"logoGif"}></img>
          <div className="mb-auto mx-auto w-full text-center text-9xl">
            UCredit
          </div>
        </div>
      ) : null}
      <Switch>
        <Route path="/dashboard">
          <Dashboard cookie={cookies.get("connect.sid")} />
        </Route>
        <Route path="/">
          <DashboardEntry createCookie={createCookie} />
        </Route>
      </Switch>
    </>
  );
}

export default withCookies(App);
