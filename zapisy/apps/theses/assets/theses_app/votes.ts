/**
 * @file Defines vote-related types and functionality
 */

import { ThesisVote } from "./protocol_types";
import { Employee } from "./users";

export type ThesisVotes = Map<Employee, ThesisVote>;

export class ThesisVoteDetails {
	// internally we use the emp ID as the key so as not to rely
	// on object pointer equality - we could easily have multiple
	// objects representing the same member
	private votes: Map<number, ThesisVote>;
	private voters: Employee[];

	public constructor(votes: Map<number, ThesisVote>, voters: Employee[]) {
		this.voters = voters;
		this.votes = votes;
	}

	public setVote(emp: Employee, vote: ThesisVote) {
		this.votes.set(emp.id, vote);
		if (!this.voters.find(emp.isEqual)) {
			this.voters.push(emp);
		}
	}

	/**
	 * Return the vote value for the given employee
	 * @param member The employee to return the vote value for
	 */
	public getVoteForMember(member: Employee): ThesisVote {
		if (this.votes.has(member.id)) {
			return this.votes.get(member.id) as ThesisVote;
		}
		return ThesisVote.None;
	}

	/**
	 * Returns all votes
	 */
	public getAllVotes(): ThesisVotes {
		const entries = this.voters.map(v => [v, this.getVoteForMember(v)]) as Array<[Employee, ThesisVote]>;
		return new Map(entries);
	}
}

export class ThesisVoteCounts {
	public constructor(public accept: number, public reject: number) { }
}
