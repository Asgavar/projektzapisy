import * as $ from "jquery";
import {loadCourseInfo} from './ajaxCourseLoad';

interface Course {
    id: number;
    url: string;
    name: string;
}

class FilteredCoursesList {
    courseList: Course[] = [];
    url: string;

    constructor(URL: string) {
        this.url = URL;
    }

    init() {
        this.fetchCourses()
            .then(courses => this.renderCourses(courses))
            .then(() => document.getElementById("fetchingListMessage").className += " hidden");
    }

    protected fetchCourses() {
        return fetch(this.url, {method: 'GET', mode: 'cors'})
            .then(response => {
                return response.json();
            })
            .then(courses => {
                this.courseList = courses.courseList;
                return this.courseList;
            });
    }

    protected createLinkFromCourse(course: Course): Node {
        let elem: Node = document.createElement("LI");
        let a = document.createElement("A");
        a.setAttribute("href", course.url);
        a.textContent = course.name;
        a.onclick = (e) => {
            e.preventDefault();
            loadCourseInfo(course.url);
        };
        elem.appendChild(a);

        return elem;
    }

    protected renderCourses(courses: Course[]) {
        let list = document.createElement("UL");
        list = document.getElementById('courses-list');
        console.log(courses);
        courses.forEach(course => {
            list.appendChild(this.createLinkFromCourse(course));
        });
    }
}

$(() => {
    new FilteredCoursesList("/courses/get_semester_info/" + 338).init();
});