class FilteredCoursesList {
    courseList: object[] = [];
    url: string;

    constructor(URL: string) {
        this.url = URL;
    }

    fetchCourses() {

    }
}

$(() => {
    new FilteredCoursesList("/courses/get_semester_info/" + 1).fetchCourses();
});