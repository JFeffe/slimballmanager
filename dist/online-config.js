// Static distributions use the hosted relay; the Site and local dev keep their own API.
export const relayOrigin='https://slimball-manager-club-retro.docile-hero-2836.chatgpt.site';
export function relayBase(href){
 const url=new URL(href),host=url.hostname;
 const external=['github.io','itch.zone','itch.io'].some(domain=>host===domain||host.endsWith('.'+domain));
 return external?relayOrigin:url.origin;
}
