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
	private emps: Employee[];

	public constructor(votes: ThesisVotes) {
		this.emps = Array.from(votes.keys());
		const transformedPairs = Array.from(votes.entries()).map(([emp, vote]) => (
			[emp.id, vote]
		)) as Array<[number, ThesisVote]>;
		this.votes = new Map(transformedPairs);
	}

	public setVote(emp: Employee, vote: ThesisVote) {
		this.votes.set(emp.id, vote);
		if (!this.emps.find(emp.isEqual)) {
			this.emps.push(emp);
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
		const transformedPairs = Array.from(this.votes.entries()).map(([id, vote]) => (
			[this.emps.find(e => e.id === id), vote]
		)) as Array<[Employee, ThesisVote]>;
		return new Map(transformedPairs);
	}
}

export class ThesisVoteCounts {
	public constructor(public accept: number, public reject: number) { }
}