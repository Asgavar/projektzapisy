/**
 * @file Theses app permission checks, mostly analogous to permissions.py
 */
import { Employee } from "./users";
import { ThesisStatus } from "./protocol_types";
import { Thesis } from "./thesis";
import { Users } from "./app_logic/users";

/**
 * Determine whether the current app user is permitted to add new thesis objects
 */
export function canAddThesis() {
	return !Users.isUserStudent();
}

/**
 * Determine whether the current app user can cast a vote as the specified user
 * @param user The user to cast a vote as
 */
export function canCastVoteAsUser(user: Employee) {
	return (
		Users.isUserAdmin() ||
		Users.isUserMemberOfBoard() && Users.currentUser.person.isEqual(user)
	);
}

/**
 * Determine whether the specified user "owns" the specified thesis
 * @param user The app user
 * Determine whether the current user "owns" the specified thesis
 * @param thesis The thesis
 */
function isOwnerOfThesis(thesis: Thesis): boolean {
	return !!thesis.advisor && thesis.advisor.isEqual(Users.currentUser.person);
}

/**
 * Determine if the current user is permitted to make any changes to the specified thesis
 * @param thesis The thesis
 */
export function canModifyThesis(thesis: Thesis) {
	if (thesis.isArchived()) {
		return Users.isUserAdmin();
	}
	return Users.isUserStaff() || isOwnerOfThesis(thesis);
}

// The functions below will only be used if the one above returns true,
// so they don't need to repeat their checks

const STATUSES_UNCHANGEABLE_BY_VOTE = [ThesisStatus.InProgress, ThesisStatus.Defended];
/**
 * Determine whether the current app user can change votes for the specified thesis
 * This only accounts for the thesis status, to check if a user
 * can vote as some other user, use `canCastVoteAsUser`
 * @param thesis The thesis to vote for
 */
export function canChangeThesisVote(thesis: Thesis) {
	return Users.isUserAdmin() || !STATUSES_UNCHANGEABLE_BY_VOTE.includes(thesis.status);
}

/**
 * Determine if the specified user is permitted to change the title of the specified thesis
 * @param thesis The thesis
 */
export function canChangeTitle(thesis: Thesis) {
	const allowedStatuses = [
		ThesisStatus.BeingEvaluated, ThesisStatus.ReturnedForCorrections,
	];
	return (
		Users.isUserStaff() ||
		isOwnerOfThesis(thesis) && allowedStatuses.includes(thesis.status)
	);
}

/**
 * Determine if a user of the specified type can modify an existing thesis' status
 */
export function canChangeStatus() {
	return Users.isUserStaff();
}

/**
 * Determine if the specified user is allowed to set any advisor on any thesis
 */
export function canSetArbitraryAdvisor() {
	return Users.isUserStaff();
}
