import { observable, flow } from "mobx";

import { getCurrentUser, getThesesBoard, getEmployees, FAKE_USER } from "../backend_callers";
import { Employee, AppUser } from "../users";
import { UserType } from "../protocol_types";

class C {
	@observable public employees: Employee[] = [];
	@observable public thesesBoard: Employee[] = [];
	@observable public currentUser: AppUser = FAKE_USER;

	public initialize = flow(function*(this: C) {
		this.employees = yield getEmployees();
		this.currentUser = yield getCurrentUser();
		this.thesesBoard = yield getThesesBoard();
	});

	/** Determine whether the current user a member of the theses board */
	// We can memoize the result - this won't change during
	// the app's lifetime, and calculating it does involve list search
	public isUserMemberOfBoard = () => {
		return !!this.thesesBoard.find(this.currentUser.person.isEqual);
	}

	/** Determine whether the current app user an admin */
	public isUserAdmin() {
		return this.currentUser.type === UserType.Admin;
	}

	/**
 	* Determine whether the current app user has a thesis staff role
 	*/
	public isUserStaff() {
		return this.isUserMemberOfBoard() || this.isUserAdmin();
	}

	/** Determine whether the current app user is an employee */
	public isUserEmployee() {
		return this.currentUser.type === UserType.Employee;
	}

	public isUserStudent() {
		return this.currentUser.type === UserType.Student;
	}

	public getEmployeeById(id: number) {
		return this.employees.find(e => e.id === id) || null;
	}
}

export const Users = new C();