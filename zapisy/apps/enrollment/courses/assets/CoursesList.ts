import * as $ from "jquery";

class CourseList {
    url: string;

    constructor(url: string) {
        this.url = url;
    }

    loadCourses() {
        return fetch(this.url, {method: 'GET', mode: 'cors'}).then(response => {
            return response.json();
        }).then(courses => console.log(courses));
    }
}


$(() => {
    new CourseList("").loadCourses();
});