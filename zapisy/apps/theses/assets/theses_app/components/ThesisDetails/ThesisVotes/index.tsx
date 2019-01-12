import * as React from "react";
import styled from "styled-components";

import { Thesis } from "../../../thesis";
import { Employee, AppUser } from "../../../users";
import { ThesisVote } from "../../../protocol_types";
import { VoteDetails } from "./VoteDetails";
import { VoteCounts } from "./VoteCounts";

type Props = {
	thesis: Thesis,
	thesesBoard: Employee[],
	user: AppUser,
	isStaff: boolean;
	onChange: (member: Employee, newValue: ThesisVote) => void;
};

/**
 * Renders the vote value for this thesis for each theses board member
 */
export const ThesisVotes = React.memo(function(props: Props) {
	const votes = props.isStaff
		? <VoteDetails
			thesis={props.thesis}
			user={props.user}
			onChange={props.onChange}
		/>
		: <VoteCounts thesis={props.thesis}/>;
	return <VotesContainer>
		<Header>Głosy</Header>
		{votes}
	</VotesContainer>;
});

const Header = styled.div`
	font-weight: bold;
	font-size: 16px;
	color: black;
	margin-bottom: 20px;
`;

const VotesContainer = styled.div`
	text-align: center;
	width: 100%;
`;
