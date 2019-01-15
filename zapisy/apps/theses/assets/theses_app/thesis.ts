/**
 * @file Defines the Thesis class and associated types
 */
import * as moment from "moment";

import { Employee, Student, Person } from "./users";
import { ThesisKind, ThesisStatus, ThesisVote } from "./protocol_types";
import { ThesisVoteCounts, ThesisVoteDetails } from "./votes";
import { Users } from "./app_logic/users";

export const MAX_THESIS_TITLE_LEN = 300;

/**
 * Native representation of a thesis
 */
export class Thesis {
	public id: number;
	public title: string;
	public advisor: Employee | null;
	public auxiliaryAdvisor: Employee | null;
	public kind: ThesisKind;
	public reserved: boolean;
	public description: string;
	public status: ThesisStatus;
	public student: Student | null;
	public secondStudent: Student | null;
	public addedDate: moment.Moment;
	public modifiedDate: moment.Moment;
	public votes: ThesisVoteDetails | ThesisVoteCounts;

	/** Construct a new thesis object with default values */
	public constructor() {
		this.id = -1;
		this.title = "";
		this.advisor = null;
		this.auxiliaryAdvisor = null;
		this.kind = ThesisKind.Bachelors;
		this.reserved = false;
		this.description = "";
		this.status = ThesisStatus.BeingEvaluated;
		this.student = null;
		this.secondStudent = null;
		this.addedDate = moment();
		this.modifiedDate = moment();
		const entries = Users.thesesBoard.map(e => [e.id, ThesisVote.None]);
		this.votes = new ThesisVoteDetails(new Map(entries as Array<[number, ThesisVote]>));
	}

	public toString() {
		return this.title;
	}

	/**
	 * Determine whether this thesis is archived, i.e. has been defended
	 */
	public isArchived() {
		return this.status === ThesisStatus.Defended;
	}

	/**
	 * Is this the same thesis as the supplied one?
	 * @param other The other thesis
	 * Note that because this is a fat arrow it can be conveniently used
	 * as a callback, i.e. theses.find(t.isEqual)
	 */
	public isEqual = (other: Thesis): boolean => {
		return this.id === other.id;
	}

	/**
	 * Determine whether the other instance of the same thesis has been modified;
	 * to compare two possibly different thesis objects, see isEqual above
	 * @param other The other thesis
	 */
	public areValuesEqual(other: Thesis): boolean {
		console.assert(
			this.isEqual(other),
			"Thesis::areValuesEqual only makes sense for two theses with the same ID",
		);
		if (!(
			this.title === other.title &&
			this.description === other.description &&
			this.personValuesEqual(this.advisor, other.advisor) &&
			this.personValuesEqual(this.auxiliaryAdvisor, other.auxiliaryAdvisor) &&
			this.personValuesEqual(this.student, other.student) &&
			this.personValuesEqual(this.secondStudent, other.secondStudent) &&
			this.kind === other.kind &&
			this.reserved === other.reserved &&
			this.status === other.status &&
			this.modifiedDate.isSame(other.modifiedDate)
		)) { return false; }
		if (
			this.hasVoteDetails() && other.hasVoteDetails() &&
			!this.getVoteDetails().isEqual(other.getVoteDetails())
		) {
			return false;
		}
		return true;
	}

	private personValuesEqual(p1: Person | null, p2: Person | null): boolean {
		return (
			p1 === null && p2 === null ||
			p1 !== null && p2 !== null && p1.isEqual(p2)
		);
	}

	public getVoteDetails() {
		if (!this.hasVoteDetails) {
			throw new Error(`Thesis ${this} has no votes`);
		}
		return this.votes as ThesisVoteDetails;
	}

	public getVoteCounts() {
		if (this.hasVoteDetails()) {
			throw new Error(`Thesis ${this} has no vote counts`);
		}
		return this.votes as ThesisVoteCounts;
	}

	public hasVoteDetails() {
		return this.votes instanceof ThesisVoteDetails;
	}

	public hasAnyVotes() {
		if (this.hasVoteDetails()) {
			return this.getVoteDetails().hasDefiniteVote();
		}
		return this.getVoteCounts().hasAnyVotes();
	}

	public isUngraded(): boolean {
		if (!this.hasVoteDetails() || !Users.isUserMemberOfBoard()) {
			return false;
		}
		const voteDetails = this.getVoteDetails();
		return voteDetails.getVoteForMember(
			Users.currentUser.person as Employee
		) === ThesisVote.None;
	}
}
