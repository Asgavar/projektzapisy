/**
 * @file Defines vote-related types and functionality
 */
import { compact, isEqual } from "lodash";

import { ThesisVote } from "./protocol_types";
import { Employee } from "./users";
import { Users } from "./app_logic/users";

export type ThesisVotes = Map<Employee, ThesisVote>;

export class ThesisVoteDetails {
	// internally we use the emp ID as the key so as not to rely
	// on object pointer equality - we could easily have multiple
	// objects representing the same member
	private votes: Map<number, ThesisVote>;

	public constructor(votes: Map<number, ThesisVote>) {
		const localVoters = compact(
			Array.from(votes.keys()).map(id => Users.getEmployeeById(id))
		);
		// de-dupe local voters and board members
		const allVoters = Array.from(new Set([...localVoters, ...Users.thesesBoard]));
		const votePairs = allVoters.map(
			v => [v.id, votes.has(v.id) ? votes.get(v.id) : ThesisVote.None]
		) as Array<[number, ThesisVote]>;
		this.votes = new Map(votePairs);
	}

	public setVote(emp: Employee, vote: ThesisVote) {
		this.votes.set(emp.id, vote);
	}

	/**
	 * Return the vote value for the given employee
	 * @param member The employee to return the vote value for
	 */
	public getVoteForMember(member: Employee): ThesisVote {
		if (this.votes.has(member.id)) {
			return this.votes.get(member.id) as ThesisVote;
		}
		console.error(`Had no vote for member ${member}, should not happen`);
		return ThesisVote.None;
	}

	/**
	 * Returns all votes
	 */
	public getAllVotes(): ThesisVotes {
		const votePairs = Array.from(this.votes.entries()).map(
			([id, vote]) => [Users.getEmployeeById(id), vote]
		) as Array<[Employee, ThesisVote]>;
		return new Map(votePairs);
	}

	/**
	 * Determine if there is a definite vote (i.e. not none)
	 */
	public hasDefiniteVote(): boolean {
		return !!Array.from(this.votes.entries()).find(
			([_, vote]) => vote !== ThesisVote.None
		);
	}

	public isEqual(other: ThesisVoteDetails) {
		return isEqual(this.votes, other.votes);
	}
}

export class ThesisVoteCounts {
	public constructor(public accept: number, public reject: number) { }

	public hasAnyVotes() {
		return this.accept > 0 || this.reject > 0;
	}
}
