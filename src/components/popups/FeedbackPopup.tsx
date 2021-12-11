import { FC } from "react";

/**
 * Feedback form popup.
 * @prop setFormPopup - opens or closes feed back form popup
 */
const FeedbackPopup: FC<{ setFormPopup: (value: boolean) => void }> = ({
  setFormPopup,
}) => {
  return (
    <div>
      {/* Background Grey */}
      <div
        className="fixed z-30 left-0 top-0 m-0 w-full h-screen bg-black opacity-50"
        onClick={() => setFormPopup(false)}
      ></div>

      {/* Popup */}
      <div
        className={
          "z-40 fixed flex flex-col bg-gradient-to-r shadow from-blue-500 to-green-400 select-none rounded z-20 h-4/5 top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/3 min-w-planAdd"
        }
      >
        <div className="px-4 py-2 text-white text-coursecard select-none">
          Feedback Form
        </div>
        {/* Search area */}
        <iframe
          src="https://docs.google.com/forms/d/e/1FAIpQLSdlEA_kykfzEu5WVCwjBkuIZuHeB1oQxaa3YL7LoDaCCLPeWg/viewform?embedded=true"
          width="640"
          height="1829"
          title="form"
          className="bg-gray-100"
        >
          Loading…
        </iframe>
      </div>
    </div>
  );
};

export default FeedbackPopup;
