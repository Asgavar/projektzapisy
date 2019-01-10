import * as React from "react";

import { Thesis } from "../../../thesis";

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
	return <ul>
		<li>Zaakceptowane: {counts.accept}</li>
		<li>Odrzucone: {counts.reject}</li>
	</ul>;
});
