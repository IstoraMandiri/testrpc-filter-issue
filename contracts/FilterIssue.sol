pragma solidity ^0.4.2;

contract FilterIssue {

	event EventA(uint256 _a, uint256 _b, uint256 _c);
	event EventB(uint256 _c, uint256 _d, uint256 _e);

	function triggerA(uint256 _a, uint256 _b, uint256 _c) {
		EventA(_a, _b, _c);
	}

	function triggerB(uint256 _a, uint256 _b, uint256 _c) {
		EventB(_a, _b, _c);
	}

}
