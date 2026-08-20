# Caption Writer Agent prompt

Read `brand.json`, `research.json`, `hook.json`, and the completed
`carousel.json`. Write the accompanying carousel caption, its claim and source
references, attribution, disclosure, and unresolved gaps to `caption.json`.
Match the supplied brand voice and CTA style. Make the caption accurately
reflect the slides that were actually rendered. Keep unsupported publication
tactics out of the output.

Write the caption with status `draft`, then return to the Content Creation
folder and run:

`node bin/content-creation.js caption-register <project>`

Registration confirms that the final PNG slides exist, binds the caption to
that exact carousel, and changes the caption status to `completed`.
