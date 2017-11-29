module.exports = {
    rawfiles: [
        {from: "legacy/css/", to: "css/"},
        {from: "legacy/help/", to: "help/"},
        {from: "legacy/images/", to: "images/"},
        {from: "legacy/js/", to: "js/"},
        {from: "legacy/vendor/", to: "vendor/"},
        {from: "legacy/favicon.ico", to: "favicon.ico"},
        {from: "legacy/feed-icon.png", to: "feed-icon.png"}
    ],
    bundles: {
        "main": [
            "common/_variables.scss",
            "common/index.ts",
            "common/index.scss"
        ],
        "fullcalendar": [
            "legacy/js/fullcalendar/fullcalendar.js",
            "legacy/js/fullcalendar/fullcalendar.css",
            "legacy/js/fullcalendar/gcal.js"
        ],
        "prototype": [
            "legacy/js/enrollment/records/PrototypeCoursesList.js",
            "legacy/js/enrollment/records/course.js",
            "legacy/js/enrollment/records/course-group.js",
            "legacy/js/enrollment/records/schedule-course-term.js",
            "legacy/js/components/sidebar.js",
            "legacy/js/components/topBarFilter.js",
            "legacy/js/components/schedule.js",
            "legacy/js/components/messageBox.js",
            "legacy/js/common/listFilter.js",
            "legacy/js/common/FilteredCoursesList.js",
            "legacy/js/common/courses-list-filters-ui.js",
            "legacy/css/enrollment/schedule-prototype.css",
            "legacy/css/common/schedule.css",
            "legacy/css/common/schedule-courses.css"
        ]
    }
};
