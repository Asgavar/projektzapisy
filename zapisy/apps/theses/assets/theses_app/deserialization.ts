import * as moment from "moment";

import { ThesisKind, ThesisStatus, UserType, ThesisVote, VoteMap } from "./protocol_types";
import { Thesis } from "./thesis";
import { Employee, Student, AppUser } from "./users";
import { ThesisVoteCounts, ThesisVoteDetails } from "./votes";
import { Users } from "./app_logic/users";

type PersonInJson = {
	id: number;
	name: string;
};
type StudentInJson = PersonInJson;
type EmployeeInJson = { username: string } & PersonInJson;

type ThesisVotesInJson = VoteMap;
type ThesisCountsInJson = { accept_cnt: number, reject_cnt: number };

/**
 * This is the format in which we receive theses from the backend
 */
export type ThesisInJson = {
	id: number;
	title: string;
	advisor?: number;
	auxiliary_advisor?: number;
	kind: ThesisKind;
	reserved: boolean;
	description: string;
	status: ThesisStatus;
	student?: PersonInJson;
	student_2?: PersonInJson;
	added_date: string;
	modified_date: string;
	votes: ThesisVotesInJson | ThesisCountsInJson;
};

type CurrentUserInJson = {
	person: EmployeeInJson | StudentInJson;
	type: UserType;
};

export function deserializeEmployee(json: EmployeeInJson) {
	return new Employee(json.id, json.name, json.username);
}

export function deserializeStudent(json: StudentInJson) {
	return new Student(json.id, json.name);
}

export function deserializeThesis(json: ThesisInJson) {
	const result = new Thesis();
	result.id = json.id;
	result.title = json.title;
	result.advisor = json.advisor ? Users.getEmployeeById(json.advisor) : null;
	result.auxiliaryAdvisor = json.auxiliary_advisor ? Users.getEmployeeById(json.auxiliary_advisor) : null;
	result.kind = json.kind;
	result.reserved = json.reserved;
	result.description = json.description;
	result.status = json.status;
	result.student = json.student ? deserializeStudent(json.student) : null;
	result.secondStudent = json.student_2 ? deserializeStudent(json.student_2) : null;
	result.addedDate = moment(json.added_date);
	result.modifiedDate = moment(json.modified_date);
	result.votes = deserializeVotes(json.votes);
	return result;
}

function deserializeVotes(
	votes: ThesisVotesInJson | ThesisCountsInJson
) {
	if ("accept_cnt" in votes && "reject_cnt" in votes) {
		return new ThesisVoteCounts(votes.accept_cnt, votes.reject_cnt);
	}
	const entries = Object
		.entries(votes)
		.map(([idStr, value]) => [Number(idStr), value]) as Array<[number, ThesisVote]>;
	return new ThesisVoteDetails(new Map(entries));
}

export function deserializeCurrentUser(json: CurrentUserInJson) {
	const person = json.type === UserType.Student
		? deserializeStudent(json.person)
		: deserializeEmployee(json.person as EmployeeInJson);
	return new AppUser(person, json.type);
}

type BoardMemberIn = number;
export function deserializeBoardMember(member: BoardMemberIn) {
	const result = Users.getEmployeeById(member);
	if (!result) {
		console.error(`Board member with ID ${member} not found, skipping`);
		return null;
	}
	return result;
}
