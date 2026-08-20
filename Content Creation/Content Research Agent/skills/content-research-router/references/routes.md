# Research routes

| Route | Status | Action |
|---|---|---|
| Social topic, post, thread, account, trend, or public conversation | Production | Use `social-media-research` |
| General topic intended for social discovery | Production | Use `social-media-research` |
| PDF, paper, report, presentation, or document | Not installed | Return `needs_specialist: document` |
| Repository, package, release, commit, or code claim | Not installed | Return `needs_specialist: software-project` |
| Recording, podcast, transcript, interview, or video | Not installed | Return `needs_specialist: audio-video` |
| Product documentation, pricing, terms, or company record | Not installed | Return `needs_specialist: product-record` |
| Ordinary article, blog, landing page, or website | Not installed | Return `needs_specialist: web-page` |
| Market, legal, scientific, financial, or other custom domain | Not installed | Build from `specialists/template` only after user approval |

Route by research domain, not downstream publication format.
