#!/usr/bin/env bash
# Neo4j's movies example, as kg commands. Requires an existing space, and
# adds to whatever is already in it.
set -euo pipefail

TheMatrix=$(kg node new --with-labels movie)
kg node "$TheMatrix" set title 'The Matrix' >/dev/null
kg node "$TheMatrix" set released '1999' >/dev/null
kg node "$TheMatrix" set tagline 'Welcome to the Real World' >/dev/null
Keanu=$(kg node new --with-labels person)
kg node "$Keanu" set name 'Keanu Reeves' >/dev/null
kg node "$Keanu" set born '1964' >/dev/null
Carrie=$(kg node new --with-labels person)
kg node "$Carrie" set name 'Carrie-Anne Moss' >/dev/null
kg node "$Carrie" set born '1967' >/dev/null
Laurence=$(kg node new --with-labels person)
kg node "$Laurence" set name 'Laurence Fishburne' >/dev/null
kg node "$Laurence" set born '1961' >/dev/null
Hugo=$(kg node new --with-labels person)
kg node "$Hugo" set name 'Hugo Weaving' >/dev/null
kg node "$Hugo" set born '1960' >/dev/null
LillyW=$(kg node new --with-labels person)
kg node "$LillyW" set name 'Lilly Wachowski' >/dev/null
kg node "$LillyW" set born '1967' >/dev/null
LanaW=$(kg node new --with-labels person)
kg node "$LanaW" set name 'Lana Wachowski' >/dev/null
kg node "$LanaW" set born '1965' >/dev/null
JoelS=$(kg node new --with-labels person)
kg node "$JoelS" set name 'Joel Silver' >/dev/null
kg node "$JoelS" set born '1952' >/dev/null
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$TheMatrix" --with-properties 'roles=Neo')
l=$(kg node "$Carrie" link --as acted-in --with-nodes "$TheMatrix" --with-properties 'roles=Trinity')
l=$(kg node "$Laurence" link --as acted-in --with-nodes "$TheMatrix" --with-properties 'roles=Morpheus')
l=$(kg node "$Hugo" link --as acted-in --with-nodes "$TheMatrix" --with-properties 'roles=Agent Smith')
l=$(kg node "$LillyW" link --as directed --with-nodes "$TheMatrix")
l=$(kg node "$LanaW" link --as directed --with-nodes "$TheMatrix")
l=$(kg node "$JoelS" link --as produced --with-nodes "$TheMatrix")
Emil=$(kg node new --with-labels person)
kg node "$Emil" set name 'Emil Eifrem' >/dev/null
kg node "$Emil" set born '1978' >/dev/null
l=$(kg node "$Emil" link --as acted-in --with-nodes "$TheMatrix")
TheMatrixReloaded=$(kg node new --with-labels movie)
kg node "$TheMatrixReloaded" set title 'The Matrix Reloaded' >/dev/null
kg node "$TheMatrixReloaded" set released '2003' >/dev/null
kg node "$TheMatrixReloaded" set tagline 'Free your mind' >/dev/null
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Neo')
l=$(kg node "$Carrie" link --as acted-in --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Trinity')
l=$(kg node "$Laurence" link --as acted-in --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Morpheus')
l=$(kg node "$Hugo" link --as acted-in --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Agent Smith')
l=$(kg node "$LillyW" link --as directed --with-nodes "$TheMatrixReloaded")
l=$(kg node "$LanaW" link --as directed --with-nodes "$TheMatrixReloaded")
l=$(kg node "$JoelS" link --as produced --with-nodes "$TheMatrixReloaded")
TheMatrixRevolutions=$(kg node new --with-labels movie)
kg node "$TheMatrixRevolutions" set title 'The Matrix Revolutions' >/dev/null
kg node "$TheMatrixRevolutions" set released '2003' >/dev/null
kg node "$TheMatrixRevolutions" set tagline 'Everything that has a beginning has an end' >/dev/null
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Neo')
l=$(kg node "$Carrie" link --as acted-in --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Trinity')
l=$(kg node "$Laurence" link --as acted-in --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Morpheus')
l=$(kg node "$Hugo" link --as acted-in --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Agent Smith')
l=$(kg node "$LillyW" link --as directed --with-nodes "$TheMatrixRevolutions")
l=$(kg node "$LanaW" link --as directed --with-nodes "$TheMatrixRevolutions")
l=$(kg node "$JoelS" link --as produced --with-nodes "$TheMatrixRevolutions")
TheDevilsAdvocate=$(kg node new --with-labels movie)
kg node "$TheDevilsAdvocate" set title 'The Devil'\''s Advocate' >/dev/null
kg node "$TheDevilsAdvocate" set released '1997' >/dev/null
kg node "$TheDevilsAdvocate" set tagline 'Evil has its winning ways' >/dev/null
Charlize=$(kg node new --with-labels person)
kg node "$Charlize" set name 'Charlize Theron' >/dev/null
kg node "$Charlize" set born '1975' >/dev/null
Al=$(kg node new --with-labels person)
kg node "$Al" set name 'Al Pacino' >/dev/null
kg node "$Al" set born '1940' >/dev/null
Taylor=$(kg node new --with-labels person)
kg node "$Taylor" set name 'Taylor Hackford' >/dev/null
kg node "$Taylor" set born '1944' >/dev/null
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$TheDevilsAdvocate" --with-properties 'roles=Kevin Lomax')
l=$(kg node "$Charlize" link --as acted-in --with-nodes "$TheDevilsAdvocate" --with-properties 'roles=Mary Ann Lomax')
l=$(kg node "$Al" link --as acted-in --with-nodes "$TheDevilsAdvocate" --with-properties 'roles=John Milton')
l=$(kg node "$Taylor" link --as directed --with-nodes "$TheDevilsAdvocate")
AFewGoodMen=$(kg node new --with-labels movie)
kg node "$AFewGoodMen" set title 'A Few Good Men' >/dev/null
kg node "$AFewGoodMen" set released '1992' >/dev/null
kg node "$AFewGoodMen" set tagline 'In the heart of the nation'\''s capital, in a courthouse of the  government, one man will stop at nothing to keep his honor, and one will stop at nothing to find the ' >/dev/null
TomC=$(kg node new --with-labels person)
kg node "$TomC" set name 'Tom Cruise' >/dev/null
kg node "$TomC" set born '1962' >/dev/null
JackN=$(kg node new --with-labels person)
kg node "$JackN" set name 'Jack Nicholson' >/dev/null
kg node "$JackN" set born '1937' >/dev/null
DemiM=$(kg node new --with-labels person)
kg node "$DemiM" set name 'Demi Moore' >/dev/null
kg node "$DemiM" set born '1962' >/dev/null
KevinB=$(kg node new --with-labels person)
kg node "$KevinB" set name 'Kevin Bacon' >/dev/null
kg node "$KevinB" set born '1958' >/dev/null
KieferS=$(kg node new --with-labels person)
kg node "$KieferS" set name 'Kiefer Sutherland' >/dev/null
kg node "$KieferS" set born '1966' >/dev/null
NoahW=$(kg node new --with-labels person)
kg node "$NoahW" set name 'Noah Wyle' >/dev/null
kg node "$NoahW" set born '1971' >/dev/null
CubaG=$(kg node new --with-labels person)
kg node "$CubaG" set name 'Cuba Gooding Jr.' >/dev/null
kg node "$CubaG" set born '1968' >/dev/null
KevinP=$(kg node new --with-labels person)
kg node "$KevinP" set name 'Kevin Pollak' >/dev/null
kg node "$KevinP" set born '1957' >/dev/null
JTW=$(kg node new --with-labels person)
kg node "$JTW" set name 'J.T. Walsh' >/dev/null
kg node "$JTW" set born '1943' >/dev/null
JamesM=$(kg node new --with-labels person)
kg node "$JamesM" set name 'James Marshall' >/dev/null
kg node "$JamesM" set born '1967' >/dev/null
ChristopherG=$(kg node new --with-labels person)
kg node "$ChristopherG" set name 'Christopher Guest' >/dev/null
kg node "$ChristopherG" set born '1948' >/dev/null
RobR=$(kg node new --with-labels person)
kg node "$RobR" set name 'Rob Reiner' >/dev/null
kg node "$RobR" set born '1947' >/dev/null
AaronS=$(kg node new --with-labels person)
kg node "$AaronS" set name 'Aaron Sorkin' >/dev/null
kg node "$AaronS" set born '1961' >/dev/null
l=$(kg node "$TomC" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Daniel Kaffee')
l=$(kg node "$JackN" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Col. Nathan R. Jessup')
l=$(kg node "$DemiM" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Cdr. JoAnne Galloway')
l=$(kg node "$KevinB" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Capt. Jack Ross')
l=$(kg node "$KieferS" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Jonathan Kendrick')
l=$(kg node "$NoahW" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Cpl. Jeffrey Barnes')
l=$(kg node "$CubaG" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Cpl. Carl Hammaker')
l=$(kg node "$KevinP" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Sam Weinberg')
l=$(kg node "$JTW" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Col. Matthew Andrew Markinson')
l=$(kg node "$JamesM" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Pfc. Louden Downey')
l=$(kg node "$ChristopherG" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Dr. Stone')
l=$(kg node "$AaronS" link --as acted-in --with-nodes "$AFewGoodMen" --with-properties 'roles=Man in Bar')
l=$(kg node "$RobR" link --as directed --with-nodes "$AFewGoodMen")
l=$(kg node "$AaronS" link --as wrote --with-nodes "$AFewGoodMen")
TopGun=$(kg node new --with-labels movie)
kg node "$TopGun" set title 'Top Gun' >/dev/null
kg node "$TopGun" set released '1986' >/dev/null
kg node "$TopGun" set tagline 'I feel the need, the need for ' >/dev/null
KellyM=$(kg node new --with-labels person)
kg node "$KellyM" set name 'Kelly McGillis' >/dev/null
kg node "$KellyM" set born '1957' >/dev/null
ValK=$(kg node new --with-labels person)
kg node "$ValK" set name 'Val Kilmer' >/dev/null
kg node "$ValK" set born '1959' >/dev/null
AnthonyE=$(kg node new --with-labels person)
kg node "$AnthonyE" set name 'Anthony Edwards' >/dev/null
kg node "$AnthonyE" set born '1962' >/dev/null
TomS=$(kg node new --with-labels person)
kg node "$TomS" set name 'Tom Skerritt' >/dev/null
kg node "$TomS" set born '1933' >/dev/null
MegR=$(kg node new --with-labels person)
kg node "$MegR" set name 'Meg Ryan' >/dev/null
kg node "$MegR" set born '1961' >/dev/null
TonyS=$(kg node new --with-labels person)
kg node "$TonyS" set name 'Tony Scott' >/dev/null
kg node "$TonyS" set born '1944' >/dev/null
JimC=$(kg node new --with-labels person)
kg node "$JimC" set name 'Jim Cash' >/dev/null
kg node "$JimC" set born '1941' >/dev/null
l=$(kg node "$TomC" link --as acted-in --with-nodes "$TopGun" --with-properties 'roles=Maverick')
l=$(kg node "$KellyM" link --as acted-in --with-nodes "$TopGun" --with-properties 'roles=Charlie')
l=$(kg node "$ValK" link --as acted-in --with-nodes "$TopGun" --with-properties 'roles=Iceman')
l=$(kg node "$AnthonyE" link --as acted-in --with-nodes "$TopGun" --with-properties 'roles=Goose')
l=$(kg node "$TomS" link --as acted-in --with-nodes "$TopGun" --with-properties 'roles=Viper')
l=$(kg node "$MegR" link --as acted-in --with-nodes "$TopGun" --with-properties 'roles=Carole')
l=$(kg node "$TonyS" link --as directed --with-nodes "$TopGun")
l=$(kg node "$JimC" link --as wrote --with-nodes "$TopGun")
JerryMaguire=$(kg node new --with-labels movie)
kg node "$JerryMaguire" set title 'Jerry Maguire' >/dev/null
kg node "$JerryMaguire" set released '2000' >/dev/null
kg node "$JerryMaguire" set tagline 'The rest of his life begins ' >/dev/null
ReneeZ=$(kg node new --with-labels person)
kg node "$ReneeZ" set name 'Renee Zellweger' >/dev/null
kg node "$ReneeZ" set born '1969' >/dev/null
KellyP=$(kg node new --with-labels person)
kg node "$KellyP" set name 'Kelly Preston' >/dev/null
kg node "$KellyP" set born '1962' >/dev/null
JerryO=$(kg node new --with-labels person)
kg node "$JerryO" set name 'Jerry O'\''Connell' >/dev/null
kg node "$JerryO" set born '1974' >/dev/null
JayM=$(kg node new --with-labels person)
kg node "$JayM" set name 'Jay Mohr' >/dev/null
kg node "$JayM" set born '1970' >/dev/null
BonnieH=$(kg node new --with-labels person)
kg node "$BonnieH" set name 'Bonnie Hunt' >/dev/null
kg node "$BonnieH" set born '1961' >/dev/null
ReginaK=$(kg node new --with-labels person)
kg node "$ReginaK" set name 'Regina King' >/dev/null
kg node "$ReginaK" set born '1971' >/dev/null
JonathanL=$(kg node new --with-labels person)
kg node "$JonathanL" set name 'Jonathan Lipnicki' >/dev/null
kg node "$JonathanL" set born '1996' >/dev/null
CameronC=$(kg node new --with-labels person)
kg node "$CameronC" set name 'Cameron Crowe' >/dev/null
kg node "$CameronC" set born '1957' >/dev/null
l=$(kg node "$TomC" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Jerry Maguire')
l=$(kg node "$CubaG" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Rod Tidwell')
l=$(kg node "$ReneeZ" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Dorothy Boyd')
l=$(kg node "$KellyP" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Avery Bishop')
l=$(kg node "$JerryO" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Frank Cushman')
l=$(kg node "$JayM" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Bob Sugar')
l=$(kg node "$BonnieH" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Laurel Boyd')
l=$(kg node "$ReginaK" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Marcee Tidwell')
l=$(kg node "$JonathanL" link --as acted-in --with-nodes "$JerryMaguire" --with-properties 'roles=Ray Boyd')
l=$(kg node "$CameronC" link --as directed --with-nodes "$JerryMaguire")
l=$(kg node "$CameronC" link --as produced --with-nodes "$JerryMaguire")
l=$(kg node "$CameronC" link --as wrote --with-nodes "$JerryMaguire")
StandByMe=$(kg node new --with-labels movie)
kg node "$StandByMe" set title 'Stand By Me' >/dev/null
kg node "$StandByMe" set released '1986' >/dev/null
kg node "$StandByMe" set tagline 'For some, it'\''s the last real taste of innocence, and the first real taste of  But for everyone, it'\''s the time that memories are made ' >/dev/null
RiverP=$(kg node new --with-labels person)
kg node "$RiverP" set name 'River Phoenix' >/dev/null
kg node "$RiverP" set born '1970' >/dev/null
CoreyF=$(kg node new --with-labels person)
kg node "$CoreyF" set name 'Corey Feldman' >/dev/null
kg node "$CoreyF" set born '1971' >/dev/null
WilW=$(kg node new --with-labels person)
kg node "$WilW" set name 'Wil Wheaton' >/dev/null
kg node "$WilW" set born '1972' >/dev/null
JohnC=$(kg node new --with-labels person)
kg node "$JohnC" set name 'John Cusack' >/dev/null
kg node "$JohnC" set born '1966' >/dev/null
MarshallB=$(kg node new --with-labels person)
kg node "$MarshallB" set name 'Marshall Bell' >/dev/null
kg node "$MarshallB" set born '1942' >/dev/null
l=$(kg node "$WilW" link --as acted-in --with-nodes "$StandByMe" --with-properties 'roles=Gordie Lachance')
l=$(kg node "$RiverP" link --as acted-in --with-nodes "$StandByMe" --with-properties 'roles=Chris Chambers')
l=$(kg node "$JerryO" link --as acted-in --with-nodes "$StandByMe" --with-properties 'roles=Vern Tessio')
l=$(kg node "$CoreyF" link --as acted-in --with-nodes "$StandByMe" --with-properties 'roles=Teddy Duchamp')
l=$(kg node "$JohnC" link --as acted-in --with-nodes "$StandByMe" --with-properties 'roles=Denny Lachance')
l=$(kg node "$KieferS" link --as acted-in --with-nodes "$StandByMe" --with-properties 'roles=Ace Merrill')
l=$(kg node "$MarshallB" link --as acted-in --with-nodes "$StandByMe" --with-properties 'roles=Mr. Lachance')
l=$(kg node "$RobR" link --as directed --with-nodes "$StandByMe")
AsGoodAsItGets=$(kg node new --with-labels movie)
kg node "$AsGoodAsItGets" set title 'As Good as It Gets' >/dev/null
kg node "$AsGoodAsItGets" set released '1997' >/dev/null
kg node "$AsGoodAsItGets" set tagline 'A comedy from the heart that goes for the ' >/dev/null
HelenH=$(kg node new --with-labels person)
kg node "$HelenH" set name 'Helen Hunt' >/dev/null
kg node "$HelenH" set born '1963' >/dev/null
GregK=$(kg node new --with-labels person)
kg node "$GregK" set name 'Greg Kinnear' >/dev/null
kg node "$GregK" set born '1963' >/dev/null
JamesB=$(kg node new --with-labels person)
kg node "$JamesB" set name 'James L. Brooks' >/dev/null
kg node "$JamesB" set born '1940' >/dev/null
l=$(kg node "$JackN" link --as acted-in --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Melvin Udall')
l=$(kg node "$HelenH" link --as acted-in --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Carol Connelly')
l=$(kg node "$GregK" link --as acted-in --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Simon Bishop')
l=$(kg node "$CubaG" link --as acted-in --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Frank Sachs')
l=$(kg node "$JamesB" link --as directed --with-nodes "$AsGoodAsItGets")
WhatDreamsMayCome=$(kg node new --with-labels movie)
kg node "$WhatDreamsMayCome" set title 'What Dreams May Come' >/dev/null
kg node "$WhatDreamsMayCome" set released '1998' >/dev/null
kg node "$WhatDreamsMayCome" set tagline 'After life there is  The end is just the ' >/dev/null
AnnabellaS=$(kg node new --with-labels person)
kg node "$AnnabellaS" set name 'Annabella Sciorra' >/dev/null
kg node "$AnnabellaS" set born '1960' >/dev/null
MaxS=$(kg node new --with-labels person)
kg node "$MaxS" set name 'Max von Sydow' >/dev/null
kg node "$MaxS" set born '1929' >/dev/null
WernerH=$(kg node new --with-labels person)
kg node "$WernerH" set name 'Werner Herzog' >/dev/null
kg node "$WernerH" set born '1942' >/dev/null
Robin=$(kg node new --with-labels person)
kg node "$Robin" set name 'Robin Williams' >/dev/null
kg node "$Robin" set born '1951' >/dev/null
VincentW=$(kg node new --with-labels person)
kg node "$VincentW" set name 'Vincent Ward' >/dev/null
kg node "$VincentW" set born '1956' >/dev/null
l=$(kg node "$Robin" link --as acted-in --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=Chris Nielsen')
l=$(kg node "$CubaG" link --as acted-in --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=Albert Lewis')
l=$(kg node "$AnnabellaS" link --as acted-in --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=Annie Collins-Nielsen')
l=$(kg node "$MaxS" link --as acted-in --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=The Tracker')
l=$(kg node "$WernerH" link --as acted-in --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=The Face')
l=$(kg node "$VincentW" link --as directed --with-nodes "$WhatDreamsMayCome")
SnowFallingonCedars=$(kg node new --with-labels movie)
kg node "$SnowFallingonCedars" set title 'Snow Falling on Cedars' >/dev/null
kg node "$SnowFallingonCedars" set released '1999' >/dev/null
kg node "$SnowFallingonCedars" set tagline 'First loves  ' >/dev/null
EthanH=$(kg node new --with-labels person)
kg node "$EthanH" set name 'Ethan Hawke' >/dev/null
kg node "$EthanH" set born '1970' >/dev/null
RickY=$(kg node new --with-labels person)
kg node "$RickY" set name 'Rick Yune' >/dev/null
kg node "$RickY" set born '1971' >/dev/null
JamesC=$(kg node new --with-labels person)
kg node "$JamesC" set name 'James Cromwell' >/dev/null
kg node "$JamesC" set born '1940' >/dev/null
ScottH=$(kg node new --with-labels person)
kg node "$ScottH" set name 'Scott Hicks' >/dev/null
kg node "$ScottH" set born '1953' >/dev/null
l=$(kg node "$EthanH" link --as acted-in --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Ishmael Chambers')
l=$(kg node "$RickY" link --as acted-in --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Kazuo Miyamoto')
l=$(kg node "$MaxS" link --as acted-in --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Nels Gudmundsson')
l=$(kg node "$JamesC" link --as acted-in --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Judge Fielding')
l=$(kg node "$ScottH" link --as directed --with-nodes "$SnowFallingonCedars")
YouveGotMail=$(kg node new --with-labels movie)
kg node "$YouveGotMail" set title 'You'\''ve Got Mail' >/dev/null
kg node "$YouveGotMail" set released '1998' >/dev/null
kg node "$YouveGotMail" set tagline 'At odds in .. in love on-' >/dev/null
TomH=$(kg node new --with-labels person)
kg node "$TomH" set name 'Tom Hanks' >/dev/null
kg node "$TomH" set born '1956' >/dev/null
ParkerP=$(kg node new --with-labels person)
kg node "$ParkerP" set name 'Parker Posey' >/dev/null
kg node "$ParkerP" set born '1968' >/dev/null
DaveC=$(kg node new --with-labels person)
kg node "$DaveC" set name 'Dave Chappelle' >/dev/null
kg node "$DaveC" set born '1973' >/dev/null
SteveZ=$(kg node new --with-labels person)
kg node "$SteveZ" set name 'Steve Zahn' >/dev/null
kg node "$SteveZ" set born '1967' >/dev/null
NoraE=$(kg node new --with-labels person)
kg node "$NoraE" set name 'Nora Ephron' >/dev/null
kg node "$NoraE" set born '1941' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$YouveGotMail" --with-properties 'roles=Joe Fox')
l=$(kg node "$MegR" link --as acted-in --with-nodes "$YouveGotMail" --with-properties 'roles=Kathleen Kelly')
l=$(kg node "$GregK" link --as acted-in --with-nodes "$YouveGotMail" --with-properties 'roles=Frank Navasky')
l=$(kg node "$ParkerP" link --as acted-in --with-nodes "$YouveGotMail" --with-properties 'roles=Patricia Eden')
l=$(kg node "$DaveC" link --as acted-in --with-nodes "$YouveGotMail" --with-properties 'roles=Kevin Jackson')
l=$(kg node "$SteveZ" link --as acted-in --with-nodes "$YouveGotMail" --with-properties 'roles=George Pappas')
l=$(kg node "$NoraE" link --as directed --with-nodes "$YouveGotMail")
SleeplessInSeattle=$(kg node new --with-labels movie)
kg node "$SleeplessInSeattle" set title 'Sleepless in Seattle' >/dev/null
kg node "$SleeplessInSeattle" set released '1993' >/dev/null
kg node "$SleeplessInSeattle" set tagline 'What if someone you never met, someone you never saw, someone you never knew was the only someone for you?' >/dev/null
RitaW=$(kg node new --with-labels person)
kg node "$RitaW" set name 'Rita Wilson' >/dev/null
kg node "$RitaW" set born '1956' >/dev/null
BillPull=$(kg node new --with-labels person)
kg node "$BillPull" set name 'Bill Pullman' >/dev/null
kg node "$BillPull" set born '1953' >/dev/null
VictorG=$(kg node new --with-labels person)
kg node "$VictorG" set name 'Victor Garber' >/dev/null
kg node "$VictorG" set born '1949' >/dev/null
RosieO=$(kg node new --with-labels person)
kg node "$RosieO" set name 'Rosie O'\''Donnell' >/dev/null
kg node "$RosieO" set born '1962' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Sam Baldwin')
l=$(kg node "$MegR" link --as acted-in --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Annie Reed')
l=$(kg node "$RitaW" link --as acted-in --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Suzy')
l=$(kg node "$BillPull" link --as acted-in --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Walter')
l=$(kg node "$VictorG" link --as acted-in --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Greg')
l=$(kg node "$RosieO" link --as acted-in --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Becky')
l=$(kg node "$NoraE" link --as directed --with-nodes "$SleeplessInSeattle")
JoeVersustheVolcano=$(kg node new --with-labels movie)
kg node "$JoeVersustheVolcano" set title 'Joe Versus the Volcano' >/dev/null
kg node "$JoeVersustheVolcano" set released '1990' >/dev/null
kg node "$JoeVersustheVolcano" set tagline 'A story of love, lava and burning ' >/dev/null
JohnS=$(kg node new --with-labels person)
kg node "$JohnS" set name 'John Patrick Stanley' >/dev/null
kg node "$JohnS" set born '1950' >/dev/null
Nathan=$(kg node new --with-labels person)
kg node "$Nathan" set name 'Nathan Lane' >/dev/null
kg node "$Nathan" set born '1956' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$JoeVersustheVolcano" --with-properties 'roles=Joe Banks')
l=$(kg node "$MegR" link --as acted-in --with-nodes "$JoeVersustheVolcano")
kg link "$l" add roles 'DeDe' 'Angelica Graynamore' 'Patricia Graynamore' >/dev/null
l=$(kg node "$Nathan" link --as acted-in --with-nodes "$JoeVersustheVolcano" --with-properties 'roles=Baw')
l=$(kg node "$JohnS" link --as directed --with-nodes "$JoeVersustheVolcano")
WhenHarryMetSally=$(kg node new --with-labels movie)
kg node "$WhenHarryMetSally" set title 'When Harry Met Sally' >/dev/null
kg node "$WhenHarryMetSally" set released '1998' >/dev/null
kg node "$WhenHarryMetSally" set tagline 'Can two friends sleep together and still love each other in the morning?' >/dev/null
BillyC=$(kg node new --with-labels person)
kg node "$BillyC" set name 'Billy Crystal' >/dev/null
kg node "$BillyC" set born '1948' >/dev/null
CarrieF=$(kg node new --with-labels person)
kg node "$CarrieF" set name 'Carrie Fisher' >/dev/null
kg node "$CarrieF" set born '1956' >/dev/null
BrunoK=$(kg node new --with-labels person)
kg node "$BrunoK" set name 'Bruno Kirby' >/dev/null
kg node "$BrunoK" set born '1949' >/dev/null
l=$(kg node "$BillyC" link --as acted-in --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Harry Burns')
l=$(kg node "$MegR" link --as acted-in --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Sally Albright')
l=$(kg node "$CarrieF" link --as acted-in --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Marie')
l=$(kg node "$BrunoK" link --as acted-in --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Jess')
l=$(kg node "$RobR" link --as directed --with-nodes "$WhenHarryMetSally")
l=$(kg node "$RobR" link --as produced --with-nodes "$WhenHarryMetSally")
l=$(kg node "$NoraE" link --as produced --with-nodes "$WhenHarryMetSally")
l=$(kg node "$NoraE" link --as wrote --with-nodes "$WhenHarryMetSally")
ThatThingYouDo=$(kg node new --with-labels movie)
kg node "$ThatThingYouDo" set title 'That Thing You Do' >/dev/null
kg node "$ThatThingYouDo" set released '1996' >/dev/null
kg node "$ThatThingYouDo" set tagline 'In every life there comes a time when that thing you dream becomes that thing you do' >/dev/null
LivT=$(kg node new --with-labels person)
kg node "$LivT" set name 'Liv Tyler' >/dev/null
kg node "$LivT" set born '1977' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$ThatThingYouDo" --with-properties 'roles=Mr. White')
l=$(kg node "$LivT" link --as acted-in --with-nodes "$ThatThingYouDo" --with-properties 'roles=Faye Dolan')
l=$(kg node "$Charlize" link --as acted-in --with-nodes "$ThatThingYouDo" --with-properties 'roles=Tina')
l=$(kg node "$TomH" link --as directed --with-nodes "$ThatThingYouDo")
TheReplacements=$(kg node new --with-labels movie)
kg node "$TheReplacements" set title 'The Replacements' >/dev/null
kg node "$TheReplacements" set released '2000' >/dev/null
kg node "$TheReplacements" set tagline 'Pain heals, Chicks dig .. Glory lasts forever' >/dev/null
Brooke=$(kg node new --with-labels person)
kg node "$Brooke" set name 'Brooke Langton' >/dev/null
kg node "$Brooke" set born '1970' >/dev/null
Gene=$(kg node new --with-labels person)
kg node "$Gene" set name 'Gene Hackman' >/dev/null
kg node "$Gene" set born '1930' >/dev/null
Orlando=$(kg node new --with-labels person)
kg node "$Orlando" set name 'Orlando Jones' >/dev/null
kg node "$Orlando" set born '1968' >/dev/null
Howard=$(kg node new --with-labels person)
kg node "$Howard" set name 'Howard Deutch' >/dev/null
kg node "$Howard" set born '1950' >/dev/null
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$TheReplacements" --with-properties 'roles=Shane Falco')
l=$(kg node "$Brooke" link --as acted-in --with-nodes "$TheReplacements" --with-properties 'roles=Annabelle Farrell')
l=$(kg node "$Gene" link --as acted-in --with-nodes "$TheReplacements" --with-properties 'roles=Jimmy McGinty')
l=$(kg node "$Orlando" link --as acted-in --with-nodes "$TheReplacements" --with-properties 'roles=Clifford Franklin')
l=$(kg node "$Howard" link --as directed --with-nodes "$TheReplacements")
RescueDawn=$(kg node new --with-labels movie)
kg node "$RescueDawn" set title 'RescueDawn' >/dev/null
kg node "$RescueDawn" set released '2006' >/dev/null
kg node "$RescueDawn" set tagline 'Based on the extraordinary true story of one man'\''s fight for freedom' >/dev/null
ChristianB=$(kg node new --with-labels person)
kg node "$ChristianB" set name 'Christian Bale' >/dev/null
kg node "$ChristianB" set born '1974' >/dev/null
ZachG=$(kg node new --with-labels person)
kg node "$ZachG" set name 'Zach Grenier' >/dev/null
kg node "$ZachG" set born '1954' >/dev/null
l=$(kg node "$MarshallB" link --as acted-in --with-nodes "$RescueDawn" --with-properties 'roles=Admiral')
l=$(kg node "$ChristianB" link --as acted-in --with-nodes "$RescueDawn" --with-properties 'roles=Dieter Dengler')
l=$(kg node "$ZachG" link --as acted-in --with-nodes "$RescueDawn" --with-properties 'roles=Squad Leader')
l=$(kg node "$SteveZ" link --as acted-in --with-nodes "$RescueDawn" --with-properties 'roles=Duane')
l=$(kg node "$WernerH" link --as directed --with-nodes "$RescueDawn")
TheBirdcage=$(kg node new --with-labels movie)
kg node "$TheBirdcage" set title 'The Birdcage' >/dev/null
kg node "$TheBirdcage" set released '1996' >/dev/null
kg node "$TheBirdcage" set tagline 'Come as you are' >/dev/null
MikeN=$(kg node new --with-labels person)
kg node "$MikeN" set name 'Mike Nichols' >/dev/null
kg node "$MikeN" set born '1931' >/dev/null
l=$(kg node "$Robin" link --as acted-in --with-nodes "$TheBirdcage" --with-properties 'roles=Armand Goldman')
l=$(kg node "$Nathan" link --as acted-in --with-nodes "$TheBirdcage" --with-properties 'roles=Albert Goldman')
l=$(kg node "$Gene" link --as acted-in --with-nodes "$TheBirdcage" --with-properties 'roles=Sen. Kevin Keeley')
l=$(kg node "$MikeN" link --as directed --with-nodes "$TheBirdcage")
Unforgiven=$(kg node new --with-labels movie)
kg node "$Unforgiven" set title 'Unforgiven' >/dev/null
kg node "$Unforgiven" set released '1992' >/dev/null
kg node "$Unforgiven" set tagline 'It'\''s a hell of a thing, killing a man' >/dev/null
RichardH=$(kg node new --with-labels person)
kg node "$RichardH" set name 'Richard Harris' >/dev/null
kg node "$RichardH" set born '1930' >/dev/null
ClintE=$(kg node new --with-labels person)
kg node "$ClintE" set name 'Clint Eastwood' >/dev/null
kg node "$ClintE" set born '1930' >/dev/null
l=$(kg node "$RichardH" link --as acted-in --with-nodes "$Unforgiven" --with-properties 'roles=English Bob')
l=$(kg node "$ClintE" link --as acted-in --with-nodes "$Unforgiven" --with-properties 'roles=Bill Munny')
l=$(kg node "$Gene" link --as acted-in --with-nodes "$Unforgiven" --with-properties 'roles=Little Bill Daggett')
l=$(kg node "$ClintE" link --as directed --with-nodes "$Unforgiven")
JohnnyMnemonic=$(kg node new --with-labels movie)
kg node "$JohnnyMnemonic" set title 'Johnny Mnemonic' >/dev/null
kg node "$JohnnyMnemonic" set released '1995' >/dev/null
kg node "$JohnnyMnemonic" set tagline 'The hottest data on  In the coolest head in town' >/dev/null
Takeshi=$(kg node new --with-labels person)
kg node "$Takeshi" set name 'Takeshi Kitano' >/dev/null
kg node "$Takeshi" set born '1947' >/dev/null
Dina=$(kg node new --with-labels person)
kg node "$Dina" set name 'Dina Meyer' >/dev/null
kg node "$Dina" set born '1968' >/dev/null
IceT=$(kg node new --with-labels person)
kg node "$IceT" set name 'Ice-T' >/dev/null
kg node "$IceT" set born '1958' >/dev/null
RobertL=$(kg node new --with-labels person)
kg node "$RobertL" set name 'Robert Longo' >/dev/null
kg node "$RobertL" set born '1953' >/dev/null
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$JohnnyMnemonic" --with-properties 'roles=Johnny Mnemonic')
l=$(kg node "$Takeshi" link --as acted-in --with-nodes "$JohnnyMnemonic" --with-properties 'roles=Takahashi')
l=$(kg node "$Dina" link --as acted-in --with-nodes "$JohnnyMnemonic" --with-properties 'roles=Jane')
l=$(kg node "$IceT" link --as acted-in --with-nodes "$JohnnyMnemonic" --with-properties 'roles=J-Bone')
l=$(kg node "$RobertL" link --as directed --with-nodes "$JohnnyMnemonic")
CloudAtlas=$(kg node new --with-labels movie)
kg node "$CloudAtlas" set title 'Cloud Atlas' >/dev/null
kg node "$CloudAtlas" set released '2012' >/dev/null
kg node "$CloudAtlas" set tagline 'Everything is connected' >/dev/null
HalleB=$(kg node new --with-labels person)
kg node "$HalleB" set name 'Halle Berry' >/dev/null
kg node "$HalleB" set born '1966' >/dev/null
JimB=$(kg node new --with-labels person)
kg node "$JimB" set name 'Jim Broadbent' >/dev/null
kg node "$JimB" set born '1949' >/dev/null
TomT=$(kg node new --with-labels person)
kg node "$TomT" set name 'Tom Tykwer' >/dev/null
kg node "$TomT" set born '1965' >/dev/null
DavidMitchell=$(kg node new --with-labels person)
kg node "$DavidMitchell" set name 'David Mitchell' >/dev/null
kg node "$DavidMitchell" set born '1969' >/dev/null
StefanArndt=$(kg node new --with-labels person)
kg node "$StefanArndt" set name 'Stefan Arndt' >/dev/null
kg node "$StefanArndt" set born '1961' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Zachry' 'Dr. Henry Goose' 'Isaac Sachs' 'Dermot Hoggins' >/dev/null
l=$(kg node "$Hugo" link --as acted-in --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Bill Smoke' 'Haskell Moore' 'Tadeusz Kesselring' 'Nurse Noakes' 'Boardman Mephi' 'Old Georgie' >/dev/null
l=$(kg node "$HalleB" link --as acted-in --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Luisa Rey' 'Jocasta Ayrs' 'Ovid' 'Meronym' >/dev/null
l=$(kg node "$JimB" link --as acted-in --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Vyvyan Ayrs' 'Captain Molyneux' 'Timothy Cavendish' >/dev/null
l=$(kg node "$TomT" link --as directed --with-nodes "$CloudAtlas")
l=$(kg node "$LillyW" link --as directed --with-nodes "$CloudAtlas")
l=$(kg node "$LanaW" link --as directed --with-nodes "$CloudAtlas")
l=$(kg node "$DavidMitchell" link --as wrote --with-nodes "$CloudAtlas")
l=$(kg node "$StefanArndt" link --as produced --with-nodes "$CloudAtlas")
TheDaVinciCode=$(kg node new --with-labels movie)
kg node "$TheDaVinciCode" set title 'The Da Vinci Code' >/dev/null
kg node "$TheDaVinciCode" set released '2006' >/dev/null
kg node "$TheDaVinciCode" set tagline 'Break The Codes' >/dev/null
IanM=$(kg node new --with-labels person)
kg node "$IanM" set name 'Ian McKellen' >/dev/null
kg node "$IanM" set born '1939' >/dev/null
AudreyT=$(kg node new --with-labels person)
kg node "$AudreyT" set name 'Audrey Tautou' >/dev/null
kg node "$AudreyT" set born '1976' >/dev/null
PaulB=$(kg node new --with-labels person)
kg node "$PaulB" set name 'Paul Bettany' >/dev/null
kg node "$PaulB" set born '1971' >/dev/null
RonH=$(kg node new --with-labels person)
kg node "$RonH" set name 'Ron Howard' >/dev/null
kg node "$RonH" set born '1954' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$TheDaVinciCode" --with-properties 'roles=Dr. Robert Langdon')
l=$(kg node "$IanM" link --as acted-in --with-nodes "$TheDaVinciCode" --with-properties 'roles=Sir Leight Teabing')
l=$(kg node "$AudreyT" link --as acted-in --with-nodes "$TheDaVinciCode" --with-properties 'roles=Sophie Neveu')
l=$(kg node "$PaulB" link --as acted-in --with-nodes "$TheDaVinciCode" --with-properties 'roles=Silas')
l=$(kg node "$RonH" link --as directed --with-nodes "$TheDaVinciCode")
VforVendetta=$(kg node new --with-labels movie)
kg node "$VforVendetta" set title 'V for Vendetta' >/dev/null
kg node "$VforVendetta" set released '2006' >/dev/null
kg node "$VforVendetta" set tagline 'Freedom! Forever!' >/dev/null
NatalieP=$(kg node new --with-labels person)
kg node "$NatalieP" set name 'Natalie Portman' >/dev/null
kg node "$NatalieP" set born '1981' >/dev/null
StephenR=$(kg node new --with-labels person)
kg node "$StephenR" set name 'Stephen Rea' >/dev/null
kg node "$StephenR" set born '1946' >/dev/null
JohnH=$(kg node new --with-labels person)
kg node "$JohnH" set name 'John Hurt' >/dev/null
kg node "$JohnH" set born '1940' >/dev/null
BenM=$(kg node new --with-labels person)
kg node "$BenM" set name 'Ben Miles' >/dev/null
kg node "$BenM" set born '1967' >/dev/null
l=$(kg node "$Hugo" link --as acted-in --with-nodes "$VforVendetta" --with-properties 'roles=V')
l=$(kg node "$NatalieP" link --as acted-in --with-nodes "$VforVendetta" --with-properties 'roles=Evey Hammond')
l=$(kg node "$StephenR" link --as acted-in --with-nodes "$VforVendetta" --with-properties 'roles=Eric Finch')
l=$(kg node "$JohnH" link --as acted-in --with-nodes "$VforVendetta" --with-properties 'roles=High Chancellor Adam Sutler')
l=$(kg node "$BenM" link --as acted-in --with-nodes "$VforVendetta" --with-properties 'roles=Dascomb')
l=$(kg node "$JamesM" link --as directed --with-nodes "$VforVendetta")
l=$(kg node "$LillyW" link --as produced --with-nodes "$VforVendetta")
l=$(kg node "$LanaW" link --as produced --with-nodes "$VforVendetta")
l=$(kg node "$JoelS" link --as produced --with-nodes "$VforVendetta")
l=$(kg node "$LillyW" link --as wrote --with-nodes "$VforVendetta")
l=$(kg node "$LanaW" link --as wrote --with-nodes "$VforVendetta")
SpeedRacer=$(kg node new --with-labels movie)
kg node "$SpeedRacer" set title 'Speed Racer' >/dev/null
kg node "$SpeedRacer" set released '2008' >/dev/null
kg node "$SpeedRacer" set tagline 'Speed has no limits' >/dev/null
EmileH=$(kg node new --with-labels person)
kg node "$EmileH" set name 'Emile Hirsch' >/dev/null
kg node "$EmileH" set born '1985' >/dev/null
JohnG=$(kg node new --with-labels person)
kg node "$JohnG" set name 'John Goodman' >/dev/null
kg node "$JohnG" set born '1960' >/dev/null
SusanS=$(kg node new --with-labels person)
kg node "$SusanS" set name 'Susan Sarandon' >/dev/null
kg node "$SusanS" set born '1946' >/dev/null
MatthewF=$(kg node new --with-labels person)
kg node "$MatthewF" set name 'Matthew Fox' >/dev/null
kg node "$MatthewF" set born '1966' >/dev/null
ChristinaR=$(kg node new --with-labels person)
kg node "$ChristinaR" set name 'Christina Ricci' >/dev/null
kg node "$ChristinaR" set born '1980' >/dev/null
Rain=$(kg node new --with-labels person)
kg node "$Rain" set name 'Rain' >/dev/null
kg node "$Rain" set born '1982' >/dev/null
l=$(kg node "$EmileH" link --as acted-in --with-nodes "$SpeedRacer" --with-properties 'roles=Speed Racer')
l=$(kg node "$JohnG" link --as acted-in --with-nodes "$SpeedRacer" --with-properties 'roles=Pops')
l=$(kg node "$SusanS" link --as acted-in --with-nodes "$SpeedRacer" --with-properties 'roles=Mom')
l=$(kg node "$MatthewF" link --as acted-in --with-nodes "$SpeedRacer" --with-properties 'roles=Racer X')
l=$(kg node "$ChristinaR" link --as acted-in --with-nodes "$SpeedRacer" --with-properties 'roles=Trixie')
l=$(kg node "$Rain" link --as acted-in --with-nodes "$SpeedRacer" --with-properties 'roles=Taejo Togokahn')
l=$(kg node "$BenM" link --as acted-in --with-nodes "$SpeedRacer" --with-properties 'roles=Cass Jones')
l=$(kg node "$LillyW" link --as directed --with-nodes "$SpeedRacer")
l=$(kg node "$LanaW" link --as directed --with-nodes "$SpeedRacer")
l=$(kg node "$LillyW" link --as wrote --with-nodes "$SpeedRacer")
l=$(kg node "$LanaW" link --as wrote --with-nodes "$SpeedRacer")
l=$(kg node "$JoelS" link --as produced --with-nodes "$SpeedRacer")
NinjaAssassin=$(kg node new --with-labels movie)
kg node "$NinjaAssassin" set title 'Ninja Assassin' >/dev/null
kg node "$NinjaAssassin" set released '2009' >/dev/null
kg node "$NinjaAssassin" set tagline 'Prepare to enter a secret world of assassins' >/dev/null
NaomieH=$(kg node new --with-labels person)
kg node "$NaomieH" set name 'Naomie Harris' >/dev/null
l=$(kg node "$Rain" link --as acted-in --with-nodes "$NinjaAssassin" --with-properties 'roles=Raizo')
l=$(kg node "$NaomieH" link --as acted-in --with-nodes "$NinjaAssassin" --with-properties 'roles=Mika Coretti')
l=$(kg node "$RickY" link --as acted-in --with-nodes "$NinjaAssassin" --with-properties 'roles=Takeshi')
l=$(kg node "$BenM" link --as acted-in --with-nodes "$NinjaAssassin" --with-properties 'roles=Ryan Maslow')
l=$(kg node "$JamesM" link --as directed --with-nodes "$NinjaAssassin")
l=$(kg node "$LillyW" link --as produced --with-nodes "$NinjaAssassin")
l=$(kg node "$LanaW" link --as produced --with-nodes "$NinjaAssassin")
l=$(kg node "$JoelS" link --as produced --with-nodes "$NinjaAssassin")
TheGreenMile=$(kg node new --with-labels movie)
kg node "$TheGreenMile" set title 'The Green Mile' >/dev/null
kg node "$TheGreenMile" set released '1999' >/dev/null
kg node "$TheGreenMile" set tagline 'Walk a mile you'\''ll never ' >/dev/null
MichaelD=$(kg node new --with-labels person)
kg node "$MichaelD" set name 'Michael Clarke Duncan' >/dev/null
kg node "$MichaelD" set born '1957' >/dev/null
DavidM=$(kg node new --with-labels person)
kg node "$DavidM" set name 'David Morse' >/dev/null
kg node "$DavidM" set born '1953' >/dev/null
SamR=$(kg node new --with-labels person)
kg node "$SamR" set name 'Sam Rockwell' >/dev/null
kg node "$SamR" set born '1968' >/dev/null
GaryS=$(kg node new --with-labels person)
kg node "$GaryS" set name 'Gary Sinise' >/dev/null
kg node "$GaryS" set born '1955' >/dev/null
PatriciaC=$(kg node new --with-labels person)
kg node "$PatriciaC" set name 'Patricia Clarkson' >/dev/null
kg node "$PatriciaC" set born '1959' >/dev/null
FrankD=$(kg node new --with-labels person)
kg node "$FrankD" set name 'Frank Darabont' >/dev/null
kg node "$FrankD" set born '1959' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles=Paul Edgecomb')
l=$(kg node "$MichaelD" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles=John Coffey')
l=$(kg node "$DavidM" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles=Brutus "Brutal" Howell')
l=$(kg node "$BonnieH" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles=Jan Edgecomb')
l=$(kg node "$JamesC" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles=Warden Hal Moores')
l=$(kg node "$SamR" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles="Wild Bill" Wharton')
l=$(kg node "$GaryS" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles=Burt Hammersmith')
l=$(kg node "$PatriciaC" link --as acted-in --with-nodes "$TheGreenMile" --with-properties 'roles=Melinda Moores')
l=$(kg node "$FrankD" link --as directed --with-nodes "$TheGreenMile")
FrostNixon=$(kg node new --with-labels movie)
kg node "$FrostNixon" set title 'Frost/Nixon' >/dev/null
kg node "$FrostNixon" set released '2008' >/dev/null
kg node "$FrostNixon" set tagline '400 million people were waiting for the ' >/dev/null
FrankL=$(kg node new --with-labels person)
kg node "$FrankL" set name 'Frank Langella' >/dev/null
kg node "$FrankL" set born '1938' >/dev/null
MichaelS=$(kg node new --with-labels person)
kg node "$MichaelS" set name 'Michael Sheen' >/dev/null
kg node "$MichaelS" set born '1969' >/dev/null
OliverP=$(kg node new --with-labels person)
kg node "$OliverP" set name 'Oliver Platt' >/dev/null
kg node "$OliverP" set born '1960' >/dev/null
l=$(kg node "$FrankL" link --as acted-in --with-nodes "$FrostNixon" --with-properties 'roles=Richard Nixon')
l=$(kg node "$MichaelS" link --as acted-in --with-nodes "$FrostNixon" --with-properties 'roles=David Frost')
l=$(kg node "$KevinB" link --as acted-in --with-nodes "$FrostNixon" --with-properties 'roles=Jack Brennan')
l=$(kg node "$OliverP" link --as acted-in --with-nodes "$FrostNixon" --with-properties 'roles=Bob Zelnick')
l=$(kg node "$SamR" link --as acted-in --with-nodes "$FrostNixon" --with-properties 'roles=James Reston, Jr.')
l=$(kg node "$RonH" link --as directed --with-nodes "$FrostNixon")
Hoffa=$(kg node new --with-labels movie)
kg node "$Hoffa" set title 'Hoffa' >/dev/null
kg node "$Hoffa" set released '1992' >/dev/null
kg node "$Hoffa" set tagline 'He didn'\''t want  He wanted ' >/dev/null
DannyD=$(kg node new --with-labels person)
kg node "$DannyD" set name 'Danny DeVito' >/dev/null
kg node "$DannyD" set born '1944' >/dev/null
JohnR=$(kg node new --with-labels person)
kg node "$JohnR" set name 'John C. Reilly' >/dev/null
kg node "$JohnR" set born '1965' >/dev/null
l=$(kg node "$JackN" link --as acted-in --with-nodes "$Hoffa" --with-properties 'roles=Hoffa')
l=$(kg node "$DannyD" link --as acted-in --with-nodes "$Hoffa" --with-properties 'roles=Robert "Bobby" Ciaro')
l=$(kg node "$JTW" link --as acted-in --with-nodes "$Hoffa" --with-properties 'roles=Frank Fitzsimmons')
l=$(kg node "$JohnR" link --as acted-in --with-nodes "$Hoffa" --with-properties 'roles=Peter "Pete" Connelly')
l=$(kg node "$DannyD" link --as directed --with-nodes "$Hoffa")
Apollo13=$(kg node new --with-labels movie)
kg node "$Apollo13" set title 'Apollo 13' >/dev/null
kg node "$Apollo13" set released '1995' >/dev/null
kg node "$Apollo13" set tagline 'Houston, we have a ' >/dev/null
EdH=$(kg node new --with-labels person)
kg node "$EdH" set name 'Ed Harris' >/dev/null
kg node "$EdH" set born '1950' >/dev/null
BillPax=$(kg node new --with-labels person)
kg node "$BillPax" set name 'Bill Paxton' >/dev/null
kg node "$BillPax" set born '1955' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$Apollo13" --with-properties 'roles=Jim Lovell')
l=$(kg node "$KevinB" link --as acted-in --with-nodes "$Apollo13" --with-properties 'roles=Jack Swigert')
l=$(kg node "$EdH" link --as acted-in --with-nodes "$Apollo13" --with-properties 'roles=Gene Kranz')
l=$(kg node "$BillPax" link --as acted-in --with-nodes "$Apollo13" --with-properties 'roles=Fred Haise')
l=$(kg node "$GaryS" link --as acted-in --with-nodes "$Apollo13" --with-properties 'roles=Ken Mattingly')
l=$(kg node "$RonH" link --as directed --with-nodes "$Apollo13")
Twister=$(kg node new --with-labels movie)
kg node "$Twister" set title 'Twister' >/dev/null
kg node "$Twister" set released '1996' >/dev/null
kg node "$Twister" set tagline 'Don'\''t  Don'\''t Look ' >/dev/null
PhilipH=$(kg node new --with-labels person)
kg node "$PhilipH" set name 'Philip Seymour Hoffman' >/dev/null
kg node "$PhilipH" set born '1967' >/dev/null
JanB=$(kg node new --with-labels person)
kg node "$JanB" set name 'Jan de Bont' >/dev/null
kg node "$JanB" set born '1943' >/dev/null
l=$(kg node "$BillPax" link --as acted-in --with-nodes "$Twister" --with-properties 'roles=Bill Harding')
l=$(kg node "$HelenH" link --as acted-in --with-nodes "$Twister" --with-properties 'roles=Dr. Jo Harding')
l=$(kg node "$ZachG" link --as acted-in --with-nodes "$Twister" --with-properties 'roles=Eddie')
l=$(kg node "$PhilipH" link --as acted-in --with-nodes "$Twister" --with-properties 'roles=Dustin "Dusty" Davis')
l=$(kg node "$JanB" link --as directed --with-nodes "$Twister")
CastAway=$(kg node new --with-labels movie)
kg node "$CastAway" set title 'Cast Away' >/dev/null
kg node "$CastAway" set released '2000' >/dev/null
kg node "$CastAway" set tagline 'At the edge of the world, his journey ' >/dev/null
RobertZ=$(kg node new --with-labels person)
kg node "$RobertZ" set name 'Robert Zemeckis' >/dev/null
kg node "$RobertZ" set born '1951' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$CastAway" --with-properties 'roles=Chuck Noland')
l=$(kg node "$HelenH" link --as acted-in --with-nodes "$CastAway" --with-properties 'roles=Kelly Frears')
l=$(kg node "$RobertZ" link --as directed --with-nodes "$CastAway")
OneFlewOvertheCuckoosNest=$(kg node new --with-labels movie)
kg node "$OneFlewOvertheCuckoosNest" set title 'One Flew Over the Cuckoo'\''s Nest' >/dev/null
kg node "$OneFlewOvertheCuckoosNest" set released '1975' >/dev/null
kg node "$OneFlewOvertheCuckoosNest" set tagline 'If he'\''s crazy, what does that make you?' >/dev/null
MilosF=$(kg node new --with-labels person)
kg node "$MilosF" set name 'Milos Forman' >/dev/null
kg node "$MilosF" set born '1932' >/dev/null
l=$(kg node "$JackN" link --as acted-in --with-nodes "$OneFlewOvertheCuckoosNest" --with-properties 'roles=Randle McMurphy')
l=$(kg node "$DannyD" link --as acted-in --with-nodes "$OneFlewOvertheCuckoosNest" --with-properties 'roles=Martini')
l=$(kg node "$MilosF" link --as directed --with-nodes "$OneFlewOvertheCuckoosNest")
SomethingsGottaGive=$(kg node new --with-labels movie)
kg node "$SomethingsGottaGive" set title 'Something'\''s Gotta Give' >/dev/null
kg node "$SomethingsGottaGive" set released '2003' >/dev/null
DianeK=$(kg node new --with-labels person)
kg node "$DianeK" set name 'Diane Keaton' >/dev/null
kg node "$DianeK" set born '1946' >/dev/null
NancyM=$(kg node new --with-labels person)
kg node "$NancyM" set name 'Nancy Meyers' >/dev/null
kg node "$NancyM" set born '1949' >/dev/null
l=$(kg node "$JackN" link --as acted-in --with-nodes "$SomethingsGottaGive" --with-properties 'roles=Harry Sanborn')
l=$(kg node "$DianeK" link --as acted-in --with-nodes "$SomethingsGottaGive" --with-properties 'roles=Erica Barry')
l=$(kg node "$Keanu" link --as acted-in --with-nodes "$SomethingsGottaGive" --with-properties 'roles=Julian Mercer')
l=$(kg node "$NancyM" link --as directed --with-nodes "$SomethingsGottaGive")
l=$(kg node "$NancyM" link --as produced --with-nodes "$SomethingsGottaGive")
l=$(kg node "$NancyM" link --as wrote --with-nodes "$SomethingsGottaGive")
BicentennialMan=$(kg node new --with-labels movie)
kg node "$BicentennialMan" set title 'Bicentennial Man' >/dev/null
kg node "$BicentennialMan" set released '1999' >/dev/null
kg node "$BicentennialMan" set tagline 'One robot'\''s 200 year journey to become an ordinary ' >/dev/null
ChrisC=$(kg node new --with-labels person)
kg node "$ChrisC" set name 'Chris Columbus' >/dev/null
kg node "$ChrisC" set born '1958' >/dev/null
l=$(kg node "$Robin" link --as acted-in --with-nodes "$BicentennialMan" --with-properties 'roles=Andrew Marin')
l=$(kg node "$OliverP" link --as acted-in --with-nodes "$BicentennialMan" --with-properties 'roles=Rupert Burns')
l=$(kg node "$ChrisC" link --as directed --with-nodes "$BicentennialMan")
CharlieWilsonsWar=$(kg node new --with-labels movie)
kg node "$CharlieWilsonsWar" set title 'Charlie Wilson'\''s War' >/dev/null
kg node "$CharlieWilsonsWar" set released '2007' >/dev/null
kg node "$CharlieWilsonsWar" set tagline 'A stiff  A little  A lot of  Who said they couldn'\''t bring down the Soviet ' >/dev/null
JuliaR=$(kg node new --with-labels person)
kg node "$JuliaR" set name 'Julia Roberts' >/dev/null
kg node "$JuliaR" set born '1967' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$CharlieWilsonsWar" --with-properties 'roles=Rep. Charlie Wilson')
l=$(kg node "$JuliaR" link --as acted-in --with-nodes "$CharlieWilsonsWar" --with-properties 'roles=Joanne Herring')
l=$(kg node "$PhilipH" link --as acted-in --with-nodes "$CharlieWilsonsWar" --with-properties 'roles=Gust Avrakotos')
l=$(kg node "$MikeN" link --as directed --with-nodes "$CharlieWilsonsWar")
ThePolarExpress=$(kg node new --with-labels movie)
kg node "$ThePolarExpress" set title 'The Polar Express' >/dev/null
kg node "$ThePolarExpress" set released '2004' >/dev/null
kg node "$ThePolarExpress" set tagline 'This Holiday .. Believe' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$ThePolarExpress")
kg link "$l" add roles 'Hero Boy' 'Father' 'Conductor' 'Hobo' 'Scrooge' 'Santa Claus' >/dev/null
l=$(kg node "$RobertZ" link --as directed --with-nodes "$ThePolarExpress")
ALeagueofTheirOwn=$(kg node new --with-labels movie)
kg node "$ALeagueofTheirOwn" set title 'A League of Their Own' >/dev/null
kg node "$ALeagueofTheirOwn" set released '1992' >/dev/null
kg node "$ALeagueofTheirOwn" set tagline 'Once in a lifetime you get a chance to do something ' >/dev/null
Madonna=$(kg node new --with-labels person)
kg node "$Madonna" set name 'Madonna' >/dev/null
kg node "$Madonna" set born '1954' >/dev/null
GeenaD=$(kg node new --with-labels person)
kg node "$GeenaD" set name 'Geena Davis' >/dev/null
kg node "$GeenaD" set born '1956' >/dev/null
LoriP=$(kg node new --with-labels person)
kg node "$LoriP" set name 'Lori Petty' >/dev/null
kg node "$LoriP" set born '1963' >/dev/null
PennyM=$(kg node new --with-labels person)
kg node "$PennyM" set name 'Penny Marshall' >/dev/null
kg node "$PennyM" set born '1943' >/dev/null
l=$(kg node "$TomH" link --as acted-in --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Jimmy Dugan')
l=$(kg node "$GeenaD" link --as acted-in --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Dottie Hinson')
l=$(kg node "$LoriP" link --as acted-in --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Kit Keller')
l=$(kg node "$RosieO" link --as acted-in --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Doris Murphy')
l=$(kg node "$Madonna" link --as acted-in --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles="All the Way" Mae Mordabito')
l=$(kg node "$BillPax" link --as acted-in --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Bob Hinson')
l=$(kg node "$PennyM" link --as directed --with-nodes "$ALeagueofTheirOwn")
PaulBlythe=$(kg node new --with-labels person)
kg node "$PaulBlythe" set name 'Paul Blythe' >/dev/null
AngelaScope=$(kg node new --with-labels person)
kg node "$AngelaScope" set name 'Angela Scope' >/dev/null
JessicaThompson=$(kg node new --with-labels person)
kg node "$JessicaThompson" set name 'Jessica Thompson' >/dev/null
JamesThompson=$(kg node new --with-labels person)
kg node "$JamesThompson" set name 'James Thompson' >/dev/null
l=$(kg node "$JamesThompson" link --as follows --with-nodes "$JessicaThompson")
l=$(kg node "$AngelaScope" link --as follows --with-nodes "$JessicaThompson")
l=$(kg node "$PaulBlythe" link --as follows --with-nodes "$AngelaScope")
l=$(kg node "$JessicaThompson" link --as reviewed --with-nodes "$CloudAtlas" --with-properties 'summary=An amazing journey' 'rating=95')
l=$(kg node "$JessicaThompson" link --as reviewed --with-nodes "$TheReplacements" --with-properties 'summary=Silly, but fun' 'rating=65')
l=$(kg node "$JamesThompson" link --as reviewed --with-nodes "$TheReplacements" --with-properties 'summary=The coolest football movie ever' 'rating=100')
l=$(kg node "$AngelaScope" link --as reviewed --with-nodes "$TheReplacements" --with-properties 'summary=Pretty funny at times' 'rating=62')
l=$(kg node "$JessicaThompson" link --as reviewed --with-nodes "$Unforgiven" --with-properties 'summary=Dark, but compelling' 'rating=85')
l=$(kg node "$JessicaThompson" link --as reviewed --with-nodes "$TheBirdcage" --with-properties 'summary=Slapstick redeemed only by the Robin Williams and Gene Hackman'\''s stellar performances' 'rating=45')
l=$(kg node "$JessicaThompson" link --as reviewed --with-nodes "$TheDaVinciCode" --with-properties 'summary=A solid romp' 'rating=68')
l=$(kg node "$JamesThompson" link --as reviewed --with-nodes "$TheDaVinciCode" --with-properties 'summary=Fun, but a little far fetched' 'rating=65')
l=$(kg node "$JessicaThompson" link --as reviewed --with-nodes "$JerryMaguire" --with-properties 'summary=You had me at Jerry' 'rating=92')
