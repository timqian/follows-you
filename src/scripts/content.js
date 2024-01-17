// const personalAccessToken = ''

async function findAuthGitHubUsername() {
	// GitHub has a top-right avatar with a link to the user's profile in the dropdown menu
	const userDropdownLink = document.querySelector('img.avatar');
	if (userDropdownLink) {
		const imageUrl = userDropdownLink.getAttribute('src');
		const usernameMatch = imageUrl.match(/\/u\/(\d+)?/);
		if (usernameMatch && usernameMatch.length > 1) {
			// Found the user ID in the image URL, now fetching username with GitHub API
			try {
				const response = await fetch(`https://api.github.com/user/${usernameMatch[1]}`, {
					headers: {
						// 'Authorization': `token ${personalAccessToken}`
					}
				});
				const data = await response.json();
				if (response.ok) {
					console.log(`The GitHub username is: ${data.login}`);
					return data.login; // Returning the username
				} else {
					throw new Error(`GitHub API returned status: ${response.status}`);
				}
			} catch (error) {
				console.error('Error fetching GitHub API:', error);
				return null; // Returning null in case of an error
			}
		}
	}
	return null; // Returning null if userDropdownLink is not found or there's no username match
}

async function checkIfUserIsFollowing(username, targetUser) {
	try {
		const response = await fetch(`https://api.github.com/users/${username}/following/${targetUser}`, {
			method: 'GET',
			headers: {
				'Accept': 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				// 'Authorization': `token ${personalAccessToken}`
			}
		});

		if (response.ok) {
			// If the status code is 204, it means the user is following the target user
			console.log(`The user is following ${targetUser}`);
			return response.status === 204;
		} else if (response.status === 404) {
			// If the status code is 404, it means the user is not following the target user
			console.log(`The user is not following ${targetUser}`);
			return false;
		} else {
			// Handle any other HTTP status codes
			// console.log(`The user is not following ${targetUser}...`);
			const errorData = await response.json();
			throw new Error(`GitHub API error: ${errorData.message}`);
		}
	} catch (error) {
		console.error('Error checking if user is following:', error);
		throw error;
	}
}



function injectFollowsTag(isFollowing, target, loading) {
	const followsBtn = document.createElement("span");
	followsBtn.classList.add('follows-you');
	followsBtn.style = `
        display: inline-block;
        margin-right: 10px;
        font-size: 12px;
        font-weight: 450;
        line-height: 16px;
        background-color: #e6ecf0;
        padding: 0px 3px;
        border-radius: 2px;
    `;
	followsBtn.innerHTML = isFollowing ? 'Follows you' : 'Not following you';
	target.appendChild(followsBtn);

}

async function run() {
	const target = document.querySelector("span.p-nickname");
	if (!target) return;

	const targetUser = target.innerText.trim();
	if (!targetUser) return; // No username found, no need to inject

	const existingTag = target.querySelector('.follows-you');
	if (existingTag) return; // Tag already exists, no need to inject again

	const authUser = await findAuthGitHubUsername();
	if (!authUser) return; // No username found, no need to inject

	if (authUser === targetUser) return; // User is viewing their own profile, no need to inject

	const isFollowing = await checkIfUserIsFollowing(targetUser, authUser);

	injectFollowsTag(isFollowing, target);

}

// Run the function once to cover the initial page load
// run();

// Create an observer to monitor for changes in the DOM
const observer = new MutationObserver((mutations, obs) => {
	// Check for URL changes here
	if (window.location.href !== window.lastHref) {
		// URL changed, run the function again
		run();
		window.lastHref = window.location.href;
	}
});

// Start observing the body for changes in the DOM
observer.observe(document.body, {
	childList: true,
	subtree: true
});