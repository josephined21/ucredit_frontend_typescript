import { useDispatch } from 'react-redux';
import { RiMapPin2Fill } from 'react-icons/ri';
import { updateSearchText } from '../../slices/roadmapSearchSlice';
import SearchBar from './searchBar';
import { useState } from 'react';

const SearchBarArea: React.FC = () => {
  const [advToolsClass, setAdvToolsClass] = useState("hidden");

  const showAdvTools = () => {
    setAdvToolsClass("");
  }

  const hideAdvTools = () => {
    setAdvToolsClass("hidden");
  }

  const oppositeAdvToolsClass = () => {
    if (advToolsClass === "hidden") {
      return "";
    } else {
      return "hidden";
    }
  }
  
  const dispatch = useDispatch();

  const onSearchInput = (evt: any) => {
    dispatch(updateSearchText(evt.target.value));
  }

  return (
    <div className="flex flex-col justify-center items-center h-60 bg-white">
      <div className="flex flex-row">
        <RiMapPin2Fill size={36} color="#94B6CC" className='hidden md:block'/>
        <h2 className={`text-blue-900 text-4xl pl-2 md:block
        ${oppositeAdvToolsClass()}`}>
          uCredit Road Map
        </h2>
      </div>
      <div className="sticky top-20 w-5/6 md:w-1/2">
        <SearchBar iconSize={28} onInputProp={onSearchInput} 
        placeHolder="Search" heightClass='h-10 md:h-12' 
        iconPosition='left-2 md:left-3'/>
        <div className="md:hidden">
          <button className={`text-center underline text-blue-600
          w-full md:hidden mb-4 ${oppositeAdvToolsClass()}`} 
          onClick={showAdvTools}>
            Show advanced search tools
          </button>
          <div className={`${advToolsClass}`}>
            <SearchBar iconSize={28} placeHolder="Search Tags" 
            heightClass='h-10 md'iconPosition='left-2' 
            onInputProp={onSearchInput}/>
            <SearchBar iconSize={28} placeHolder="Search Majors" 
            heightClass='h-10 md'iconPosition='left-2' 
            onInputProp={onSearchInput}/>
            <div>
              <p className="relative left-2 inline-block">
                <input type="checkbox" className="mr-2"/>
                My favorites only
              </p>
              <button className={`text-center underline text-gray-500
              md:hidden float-right ${advToolsClass}`} 
              onClick={hideAdvTools}>
                Collapse
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  
export default SearchBarArea;