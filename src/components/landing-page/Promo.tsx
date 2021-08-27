import React, { FC } from "react";
import data from "./promoData";

const Promo: FC = () => {
  return (
    <div className='flex flex-col items-center px-16 pb-8 my-8'>
      <div className='mb-6 font-serif text-lg font-semibold border-b border-theme'>
        Why uCredit?
      </div>
      <div className='grid grid-flow-row grid-cols-2 gap-x-4 gap-y-8' style={{ gridTemplateRows: "repeat(4, minmax(100px, 250px))" }}>
        {data.map((d) => {
          return !d.order ? (
            <>
              <div>
                <div className='text-lg font-bold'>{d.title}</div>
                <div>{d.desc}</div>
              </div>
              <div className='flex justify-center bg-gray-200 rounded-md'>
                <img alt='' src={d.img} />
              </div>
            </>
          ) : (
            <>
              <div className='flex justify-center bg-gray-200 rounded-md'>
                <img alt='' src={d.img} />
              </div>
              <div>
                <div className='text-lg font-bold'>{d.title}</div>
                <div>{d.desc}</div>
              </div>
            </>
          );
        })}
      </div>
    </div>
  );
};

export default Promo;
