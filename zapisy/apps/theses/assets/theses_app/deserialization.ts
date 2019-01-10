import * as moment from "moment";

import { ThesisKind, ThesisStatus, UserType, ThesisVote } from "./protocol_types";
import { Thesis } from "./thesis";
import { Employee, Student, AppUser } from "./users";
import { ThesisVoteCounts, ThesisVoteDetails } from "./votes";
import { Users } from "./app_logic/users";

type PersonInJson = {
	id: number;
	display_name: string;
};

type ThesisVotesInJson = {
	vote_values: { [_: number]: ThesisVote },
	old_voters: PersonInJson[],
};
type ThesisCountsInJson = { accept_cnt: number, reject_cnt: number };

/**
 * This is the format in which we receive theses from the backend
 */
export type ThesisInJson = {
	id: number;
	title: string;
	advisor?: PersonInJson;
	auxiliary_advisor?: PersonInJson;
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
	user: PersonInJson;
	type: UserType;
};

export function deserializeEmployee(json: PersonInJson) {
	return new Employee(json.id, json.display_name);
}

export function deserializeStudent(json: PersonInJson) {
	return new Student(json.id, json.display_name);
}

export function deserializeThesis(json: ThesisInJson) {
	const result = new Thesis();
	result.id = json.id;
	result.title = json.title;
	result.advisor = json.advisor ? deserializeEmployee(json.advisor) : null;
	result.auxiliaryAdvisor = json.auxiliary_advisor ? deserializeEmployee(json.auxiliary_advisor) : null;
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
		.entries(votes.vote_values)
		.map(([idStr, value]) => [Number(idStr), value]) as Array<[number, ThesisVote]>;
	const oldVoters = votes.old_voters.map(deserializeEmployee);
	const allVoters = Users.thesesBoard.concat(oldVoters);
	return new ThesisVoteDetails(new Map(entries), allVoters);
}

export function deserializeCurrentUser(json: CurrentUserInJson) {
	const deserializer = json.type === UserType.Student
		? deserializeStudent
		: deserializeEmployee;
	return new AppUser(deserializer(json.user), json.type);
}
