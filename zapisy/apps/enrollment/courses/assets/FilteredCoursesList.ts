import * as $ from 'jquery';

interface Course {
    id: number;
    url: string;
    name: string;
}

class FilteredCoursesList {
    url: string;

    constructor(URL: string) {
        this.url = URL;
    }

    init() {
        this.fetchCourses()
            .then(courses => this.renderCourses(courses.courseList))
            .then(() => document.getElementById("fetchingListMessage").className += " hidden");
    }

    protected fetchCourses() {
        return fetch(this.url, {method: 'GET', mode: 'cors'})
            .then(response => {
                return response.json();
            })
    }

    protected createLinkFromCourse(course: Course): Node {
        let elem: Node = document.createElement("LI");
        let a = document.createElement("A");
        a.setAttribute("href", course.url);
        a.textContent = course.name;

        // let text = document.createTextNode(course.name);
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