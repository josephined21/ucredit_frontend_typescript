import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectRetrievedCourses } from "../../slices/searchSlice";
import CourseCard from "./CourseCard";
import ReactPaginate from "react-paginate";

const SearchList = () => {
  const [pageNum, setPageNum] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const courses = useSelector(selectRetrievedCourses);
  let coursesPerPage = 10;

  useEffect(() => {
    // If coursesPerPage doesn't divide perfectly into total courses, we need one more page.
    const division = Math.floor(courses.length / coursesPerPage);
    const pages =
      courses.length % coursesPerPage === 0 ? division : division + 1;
    setPageCount(pages);
  }, [courses]);

  // Generates a list of 10 retrieved course matching the search queries and page number.
  const courseList = () => {
    let toDisplay: any = [];
    let startingIndex = pageNum * coursesPerPage;
    let endingIndex =
      startingIndex + coursesPerPage > courses.length
        ? courses.length - 1
        : startingIndex + coursesPerPage - 1;
    for (let i = startingIndex; i <= endingIndex; i++) {
      toDisplay[i - startingIndex] = <CourseCard course={courses[i]} />;
    }
    return toDisplay;
  };

  // Sets page number when clicking on a page in the pagination component.
  const handlePageClick = (event: any) => {
    setPageNum(event.selected);
  };

  return (
    <div className="flex-1 m-3 p-2 bg-gray-300">
      <p>Search Results </p>

      {courses.length > 0 ? (
        <div className="flex flex-col overflow-vertical">{courseList()}</div>
      ) : (
        <div>No Results</div>
      )}

      {/* A Pagination component we'll use! Prop list and docs here: https://github.com/AdeleD/react-paginate. '
      Use it to add new classnames when styling and add new props for logic */}
      {pageCount > 1 ? (
        <ReactPaginate
          previousLabel={"<"}
          nextLabel={">"}
          previousClassName={"m-2"}
          nextClassName={"m-2"}
          breakLabel={"..."}
          breakClassName={""}
          pageCount={pageCount}
          marginPagesDisplayed={2}
          pageRangeDisplayed={3}
          onPageChange={handlePageClick}
          containerClassName={"flex"}
          activeClassName={"bg-gray-500"}
          pageClassName={"m-2"}
        />
      ) : null}
    </div>
  );
};

export default SearchList;
