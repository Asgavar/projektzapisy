import * as React from "react";

import { Thesis } from "../../../thesis";
import { VoteIndicator } from "./VoteIndicator";
import { ThesisVote } from "../../../protocol_types";

type Props = {
	thesis: Thesis;
};

/**
 * Renders the vote counts, i.e. how many votes of each type the specified thesis has
 */
export const VoteCounts = React.memo(function(props: Props) {
	if (props.thesis.hasVoteDetails()) {
		console.error(`Cannot render vote counts for ${props.thesis}`);
		return null;
	}
	const counts = props.thesis.getVoteCounts();
	return <>
		<p><VoteIndicator active value={ThesisVote.Accepted} /> {counts.accept}</p>
		<p><VoteIndicator active value={ThesisVote.Rejected} /> {counts.reject}</p>
	</>;
});
