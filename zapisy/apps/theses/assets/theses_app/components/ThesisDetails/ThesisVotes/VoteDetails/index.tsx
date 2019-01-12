import * as React from "react";
import { compact } from "lodash";

import { SingleVote } from "./SingleVote";
import { Thesis } from "../../../../thesis";
import { Employee, AppUser } from "../../../../users";
import { ThesisVote } from "../../../../protocol_types";
import { canChangeThesisVote } from "../../../../permissions";
import { strcmp } from "common/utils";

type Props = {
	thesis: Thesis;
	user: AppUser;
	onChange: (member: Employee, newValue: ThesisVote) => void;
};

/**
 * Renders the vote value for this thesis for each theses board member
 */
export const VoteDetails = React.memo(function(props: Props) {
	const displayAll = shouldDisplayAllVotes(props.thesis);
	if (!props.thesis.hasVoteDetails()) {
		console.error(`Cannot render vote details for ${props.thesis}`);
		return null;
	}
	const details = props.thesis.getVoteDetails();
	const votes = Array.from(details.getAllVotes().entries());
	votes.sort(([e1, _1], [e2, _2]) => (
		strcmp(e1.username, e2.username)
	));
	const result = compact(votes.map(([voter, vote], i) => {
		if (!displayAll && vote === ThesisVote.None) {
			return null;
		}
		return <SingleVote
			key={i}
			voter={voter}
			value={vote}
			user={props.user}
			thesis={props.thesis}
			onChange={props.onChange}
		/>;
	}));
	return result.length ? <>{result}</> : <span>Brak głosów</span>;
});

/** Determine whether or not to display all votes, including
 * indeterminate ones, for this thesis
 */
function shouldDisplayAllVotes(thesis: Thesis) {
	return canChangeThesisVote(thesis);
}
