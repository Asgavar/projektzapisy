import * as React from "react";

import { SingleVote } from "./SingleVote";
import styled from "styled-components";
import { Thesis } from "../../../thesis";
import { Employee, AppUser } from "../../../users";
import { ThesisVote } from "../../../protocol_types";

type Props = {
	thesis: Thesis,
	thesesBoard: Employee[],
	user: AppUser,
	onChange: (member: Employee, newValue: ThesisVote) => void;
};

/**
 * Renders the vote value for this thesis for each theses board member
 */
export const ThesisVotes = React.memo(function(props: Props) {
	const board = props.thesesBoard;
	const votes = board.length ? board.map((emp, i) => (
		<SingleVote
			key={i}
			voter={emp}
			value={props.thesis.votes}
			user={props.user}
			onChange={props.onChange}
		/>
	)) : <span>Nie zdefiniowano członków komisji</span>;
	return <VotesContainer>
		<Header>Głosy</Header>
		{votes}
	</VotesContainer>;
});

const Header = styled.div`
	font-weight: bold;
	font-size: 16px;
	color: black;
	margin-bottom: 15px;
`;

const VotesContainer = styled.div`
	text-align: center;
	width: 100%;
`;
