import * as $ from 'jquery';

class FilteredCoursesList {
    courseList: object[] = [];
    url: string;

    constructor(URL: string) {
        this.url = URL;
    }

    fetchCourses() {
        return fetch(this.url, {method: 'GET', mode: 'cors'})
            .then(response => {
                return response.json();
            })
            .then(courses => this.courseList = courses.courseList)
            .then(() => console.log(this.courseList));
    }
}

$(() => {
    new FilteredCoursesList("/courses/get_semester_info/" + 338).fetchCourses();
});