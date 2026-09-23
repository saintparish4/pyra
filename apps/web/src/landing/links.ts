const CONTACT = "mailto:saintparish6@gmail.com";

/** Every call to action on the page is one mail draft with a different subject. */
export function contactLink(subject: string, body?: string): string {
	const query = new URLSearchParams({ subject });
	if (body) {
		query.set("body", body);
	}
	return `${CONTACT}?${query.toString()}`;
}

export { CONTACT };
