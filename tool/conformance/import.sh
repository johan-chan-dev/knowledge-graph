#!/usr/bin/env bash
# Neo4j's movies example, as kg commands. Requires an existing space, and
# adds to whatever is already in it.
#
# One line of output per thing made. `set` and `add` acknowledge on stderr
# and are silenced; a failure still stops the script, since `set -e` does not
# need the message to do it.
set -euo pipefail

printf '[%3d/171] %-6s %s\n' 1 'Movie' 'The Matrix'
TheMatrix=$(kg node new --with-labels Movie)
kg node "$TheMatrix" set title 'The Matrix' >/dev/null 2>&1
kg node "$TheMatrix" set released '1999' >/dev/null 2>&1
kg node "$TheMatrix" set tagline 'Welcome to the Real World' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 2 'Person' 'Keanu Reeves'
Keanu=$(kg node new --with-labels Person)
kg node "$Keanu" set name 'Keanu Reeves' >/dev/null 2>&1
kg node "$Keanu" set born '1964' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 3 'Person' 'Carrie-Anne Moss'
Carrie=$(kg node new --with-labels Person)
kg node "$Carrie" set name 'Carrie-Anne Moss' >/dev/null 2>&1
kg node "$Carrie" set born '1967' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 4 'Person' 'Laurence Fishburne'
Laurence=$(kg node new --with-labels Person)
kg node "$Laurence" set name 'Laurence Fishburne' >/dev/null 2>&1
kg node "$Laurence" set born '1961' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 5 'Person' 'Hugo Weaving'
Hugo=$(kg node new --with-labels Person)
kg node "$Hugo" set name 'Hugo Weaving' >/dev/null 2>&1
kg node "$Hugo" set born '1960' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 6 'Person' 'Lilly Wachowski'
LillyW=$(kg node new --with-labels Person)
kg node "$LillyW" set name 'Lilly Wachowski' >/dev/null 2>&1
kg node "$LillyW" set born '1967' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 7 'Person' 'Lana Wachowski'
LanaW=$(kg node new --with-labels Person)
kg node "$LanaW" set name 'Lana Wachowski' >/dev/null 2>&1
kg node "$LanaW" set born '1965' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 8 'Person' 'Joel Silver'
JoelS=$(kg node new --with-labels Person)
kg node "$JoelS" set name 'Joel Silver' >/dev/null 2>&1
kg node "$JoelS" set born '1952' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 1 'ACTED_IN' 'Keanu Reeves' 'The Matrix'
l=$(kg node "$Keanu" link --as ACTED_IN --with-nodes "$TheMatrix" --with-properties 'roles=Neo')
printf '[%3d/253] %-10s %s -> %s\n' 2 'ACTED_IN' 'Carrie-Anne Moss' 'The Matrix'
l=$(kg node "$Carrie" link --as ACTED_IN --with-nodes "$TheMatrix" --with-properties 'roles=Trinity')
printf '[%3d/253] %-10s %s -> %s\n' 3 'ACTED_IN' 'Laurence Fishburne' 'The Matrix'
l=$(kg node "$Laurence" link --as ACTED_IN --with-nodes "$TheMatrix" --with-properties 'roles=Morpheus')
printf '[%3d/253] %-10s %s -> %s\n' 4 'ACTED_IN' 'Hugo Weaving' 'The Matrix'
l=$(kg node "$Hugo" link --as ACTED_IN --with-nodes "$TheMatrix" --with-properties 'roles=Agent Smith')
printf '[%3d/253] %-10s %s -> %s\n' 5 'DIRECTED' 'Lilly Wachowski' 'The Matrix'
l=$(kg node "$LillyW" link --as DIRECTED --with-nodes "$TheMatrix")
printf '[%3d/253] %-10s %s -> %s\n' 6 'DIRECTED' 'Lana Wachowski' 'The Matrix'
l=$(kg node "$LanaW" link --as DIRECTED --with-nodes "$TheMatrix")
printf '[%3d/253] %-10s %s -> %s\n' 7 'PRODUCED' 'Joel Silver' 'The Matrix'
l=$(kg node "$JoelS" link --as PRODUCED --with-nodes "$TheMatrix")
printf '[%3d/171] %-6s %s\n' 9 'Person' 'Emil Eifrem'
Emil=$(kg node new --with-labels Person)
kg node "$Emil" set name 'Emil Eifrem' >/dev/null 2>&1
kg node "$Emil" set born '1978' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 8 'ACTED_IN' 'Emil Eifrem' 'The Matrix'
l=$(kg node "$Emil" link --as ACTED_IN --with-nodes "$TheMatrix")
printf '[%3d/171] %-6s %s\n' 10 'Movie' 'The Matrix Reloaded'
TheMatrixReloaded=$(kg node new --with-labels Movie)
kg node "$TheMatrixReloaded" set title 'The Matrix Reloaded' >/dev/null 2>&1
kg node "$TheMatrixReloaded" set released '2003' >/dev/null 2>&1
kg node "$TheMatrixReloaded" set tagline 'Free your mind' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 9 'ACTED_IN' 'Keanu Reeves' 'The Matrix Reloaded'
l=$(kg node "$Keanu" link --as ACTED_IN --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Neo')
printf '[%3d/253] %-10s %s -> %s\n' 10 'ACTED_IN' 'Carrie-Anne Moss' 'The Matrix Reloaded'
l=$(kg node "$Carrie" link --as ACTED_IN --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Trinity')
printf '[%3d/253] %-10s %s -> %s\n' 11 'ACTED_IN' 'Laurence Fishburne' 'The Matrix Reloaded'
l=$(kg node "$Laurence" link --as ACTED_IN --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Morpheus')
printf '[%3d/253] %-10s %s -> %s\n' 12 'ACTED_IN' 'Hugo Weaving' 'The Matrix Reloaded'
l=$(kg node "$Hugo" link --as ACTED_IN --with-nodes "$TheMatrixReloaded" --with-properties 'roles=Agent Smith')
printf '[%3d/253] %-10s %s -> %s\n' 13 'DIRECTED' 'Lilly Wachowski' 'The Matrix Reloaded'
l=$(kg node "$LillyW" link --as DIRECTED --with-nodes "$TheMatrixReloaded")
printf '[%3d/253] %-10s %s -> %s\n' 14 'DIRECTED' 'Lana Wachowski' 'The Matrix Reloaded'
l=$(kg node "$LanaW" link --as DIRECTED --with-nodes "$TheMatrixReloaded")
printf '[%3d/253] %-10s %s -> %s\n' 15 'PRODUCED' 'Joel Silver' 'The Matrix Reloaded'
l=$(kg node "$JoelS" link --as PRODUCED --with-nodes "$TheMatrixReloaded")
printf '[%3d/171] %-6s %s\n' 11 'Movie' 'The Matrix Revolutions'
TheMatrixRevolutions=$(kg node new --with-labels Movie)
kg node "$TheMatrixRevolutions" set title 'The Matrix Revolutions' >/dev/null 2>&1
kg node "$TheMatrixRevolutions" set released '2003' >/dev/null 2>&1
kg node "$TheMatrixRevolutions" set tagline 'Everything that has a beginning has an end' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 16 'ACTED_IN' 'Keanu Reeves' 'The Matrix Revolutions'
l=$(kg node "$Keanu" link --as ACTED_IN --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Neo')
printf '[%3d/253] %-10s %s -> %s\n' 17 'ACTED_IN' 'Carrie-Anne Moss' 'The Matrix Revolutions'
l=$(kg node "$Carrie" link --as ACTED_IN --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Trinity')
printf '[%3d/253] %-10s %s -> %s\n' 18 'ACTED_IN' 'Laurence Fishburne' 'The Matrix Revolutions'
l=$(kg node "$Laurence" link --as ACTED_IN --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Morpheus')
printf '[%3d/253] %-10s %s -> %s\n' 19 'ACTED_IN' 'Hugo Weaving' 'The Matrix Revolutions'
l=$(kg node "$Hugo" link --as ACTED_IN --with-nodes "$TheMatrixRevolutions" --with-properties 'roles=Agent Smith')
printf '[%3d/253] %-10s %s -> %s\n' 20 'DIRECTED' 'Lilly Wachowski' 'The Matrix Revolutions'
l=$(kg node "$LillyW" link --as DIRECTED --with-nodes "$TheMatrixRevolutions")
printf '[%3d/253] %-10s %s -> %s\n' 21 'DIRECTED' 'Lana Wachowski' 'The Matrix Revolutions'
l=$(kg node "$LanaW" link --as DIRECTED --with-nodes "$TheMatrixRevolutions")
printf '[%3d/253] %-10s %s -> %s\n' 22 'PRODUCED' 'Joel Silver' 'The Matrix Revolutions'
l=$(kg node "$JoelS" link --as PRODUCED --with-nodes "$TheMatrixRevolutions")
printf '[%3d/171] %-6s %s\n' 12 'Movie' 'The Devil'\''s Advocate'
TheDevilsAdvocate=$(kg node new --with-labels Movie)
kg node "$TheDevilsAdvocate" set title 'The Devil'\''s Advocate' >/dev/null 2>&1
kg node "$TheDevilsAdvocate" set released '1997' >/dev/null 2>&1
kg node "$TheDevilsAdvocate" set tagline 'Evil has its winning ways' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 13 'Person' 'Charlize Theron'
Charlize=$(kg node new --with-labels Person)
kg node "$Charlize" set name 'Charlize Theron' >/dev/null 2>&1
kg node "$Charlize" set born '1975' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 14 'Person' 'Al Pacino'
Al=$(kg node new --with-labels Person)
kg node "$Al" set name 'Al Pacino' >/dev/null 2>&1
kg node "$Al" set born '1940' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 15 'Person' 'Taylor Hackford'
Taylor=$(kg node new --with-labels Person)
kg node "$Taylor" set name 'Taylor Hackford' >/dev/null 2>&1
kg node "$Taylor" set born '1944' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 23 'ACTED_IN' 'Keanu Reeves' 'The Devil'\''s Advocate'
l=$(kg node "$Keanu" link --as ACTED_IN --with-nodes "$TheDevilsAdvocate" --with-properties 'roles=Kevin Lomax')
printf '[%3d/253] %-10s %s -> %s\n' 24 'ACTED_IN' 'Charlize Theron' 'The Devil'\''s Advocate'
l=$(kg node "$Charlize" link --as ACTED_IN --with-nodes "$TheDevilsAdvocate" --with-properties 'roles=Mary Ann Lomax')
printf '[%3d/253] %-10s %s -> %s\n' 25 'ACTED_IN' 'Al Pacino' 'The Devil'\''s Advocate'
l=$(kg node "$Al" link --as ACTED_IN --with-nodes "$TheDevilsAdvocate" --with-properties 'roles=John Milton')
printf '[%3d/253] %-10s %s -> %s\n' 26 'DIRECTED' 'Taylor Hackford' 'The Devil'\''s Advocate'
l=$(kg node "$Taylor" link --as DIRECTED --with-nodes "$TheDevilsAdvocate")
printf '[%3d/171] %-6s %s\n' 16 'Movie' 'A Few Good Men'
AFewGoodMen=$(kg node new --with-labels Movie)
kg node "$AFewGoodMen" set title 'A Few Good Men' >/dev/null 2>&1
kg node "$AFewGoodMen" set released '1992' >/dev/null 2>&1
kg node "$AFewGoodMen" set tagline 'In the heart of the nation'\''s capital, in a courthouse of the  government, one man will stop at nothing to keep his honor, and one will stop at nothing to find the ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 17 'Person' 'Tom Cruise'
TomC=$(kg node new --with-labels Person)
kg node "$TomC" set name 'Tom Cruise' >/dev/null 2>&1
kg node "$TomC" set born '1962' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 18 'Person' 'Jack Nicholson'
JackN=$(kg node new --with-labels Person)
kg node "$JackN" set name 'Jack Nicholson' >/dev/null 2>&1
kg node "$JackN" set born '1937' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 19 'Person' 'Demi Moore'
DemiM=$(kg node new --with-labels Person)
kg node "$DemiM" set name 'Demi Moore' >/dev/null 2>&1
kg node "$DemiM" set born '1962' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 20 'Person' 'Kevin Bacon'
KevinB=$(kg node new --with-labels Person)
kg node "$KevinB" set name 'Kevin Bacon' >/dev/null 2>&1
kg node "$KevinB" set born '1958' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 21 'Person' 'Kiefer Sutherland'
KieferS=$(kg node new --with-labels Person)
kg node "$KieferS" set name 'Kiefer Sutherland' >/dev/null 2>&1
kg node "$KieferS" set born '1966' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 22 'Person' 'Noah Wyle'
NoahW=$(kg node new --with-labels Person)
kg node "$NoahW" set name 'Noah Wyle' >/dev/null 2>&1
kg node "$NoahW" set born '1971' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 23 'Person' 'Cuba Gooding Jr.'
CubaG=$(kg node new --with-labels Person)
kg node "$CubaG" set name 'Cuba Gooding Jr.' >/dev/null 2>&1
kg node "$CubaG" set born '1968' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 24 'Person' 'Kevin Pollak'
KevinP=$(kg node new --with-labels Person)
kg node "$KevinP" set name 'Kevin Pollak' >/dev/null 2>&1
kg node "$KevinP" set born '1957' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 25 'Person' 'J.T. Walsh'
JTW=$(kg node new --with-labels Person)
kg node "$JTW" set name 'J.T. Walsh' >/dev/null 2>&1
kg node "$JTW" set born '1943' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 26 'Person' 'James Marshall'
JamesM=$(kg node new --with-labels Person)
kg node "$JamesM" set name 'James Marshall' >/dev/null 2>&1
kg node "$JamesM" set born '1967' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 27 'Person' 'Christopher Guest'
ChristopherG=$(kg node new --with-labels Person)
kg node "$ChristopherG" set name 'Christopher Guest' >/dev/null 2>&1
kg node "$ChristopherG" set born '1948' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 28 'Person' 'Rob Reiner'
RobR=$(kg node new --with-labels Person)
kg node "$RobR" set name 'Rob Reiner' >/dev/null 2>&1
kg node "$RobR" set born '1947' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 29 'Person' 'Aaron Sorkin'
AaronS=$(kg node new --with-labels Person)
kg node "$AaronS" set name 'Aaron Sorkin' >/dev/null 2>&1
kg node "$AaronS" set born '1961' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 27 'ACTED_IN' 'Tom Cruise' 'A Few Good Men'
l=$(kg node "$TomC" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Daniel Kaffee')
printf '[%3d/253] %-10s %s -> %s\n' 28 'ACTED_IN' 'Jack Nicholson' 'A Few Good Men'
l=$(kg node "$JackN" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Col. Nathan R. Jessup')
printf '[%3d/253] %-10s %s -> %s\n' 29 'ACTED_IN' 'Demi Moore' 'A Few Good Men'
l=$(kg node "$DemiM" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Cdr. JoAnne Galloway')
printf '[%3d/253] %-10s %s -> %s\n' 30 'ACTED_IN' 'Kevin Bacon' 'A Few Good Men'
l=$(kg node "$KevinB" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Capt. Jack Ross')
printf '[%3d/253] %-10s %s -> %s\n' 31 'ACTED_IN' 'Kiefer Sutherland' 'A Few Good Men'
l=$(kg node "$KieferS" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Jonathan Kendrick')
printf '[%3d/253] %-10s %s -> %s\n' 32 'ACTED_IN' 'Noah Wyle' 'A Few Good Men'
l=$(kg node "$NoahW" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Cpl. Jeffrey Barnes')
printf '[%3d/253] %-10s %s -> %s\n' 33 'ACTED_IN' 'Cuba Gooding Jr.' 'A Few Good Men'
l=$(kg node "$CubaG" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Cpl. Carl Hammaker')
printf '[%3d/253] %-10s %s -> %s\n' 34 'ACTED_IN' 'Kevin Pollak' 'A Few Good Men'
l=$(kg node "$KevinP" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Sam Weinberg')
printf '[%3d/253] %-10s %s -> %s\n' 35 'ACTED_IN' 'J.T. Walsh' 'A Few Good Men'
l=$(kg node "$JTW" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Lt. Col. Matthew Andrew Markinson')
printf '[%3d/253] %-10s %s -> %s\n' 36 'ACTED_IN' 'James Marshall' 'A Few Good Men'
l=$(kg node "$JamesM" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Pfc. Louden Downey')
printf '[%3d/253] %-10s %s -> %s\n' 37 'ACTED_IN' 'Christopher Guest' 'A Few Good Men'
l=$(kg node "$ChristopherG" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Dr. Stone')
printf '[%3d/253] %-10s %s -> %s\n' 38 'ACTED_IN' 'Aaron Sorkin' 'A Few Good Men'
l=$(kg node "$AaronS" link --as ACTED_IN --with-nodes "$AFewGoodMen" --with-properties 'roles=Man in Bar')
printf '[%3d/253] %-10s %s -> %s\n' 39 'DIRECTED' 'Rob Reiner' 'A Few Good Men'
l=$(kg node "$RobR" link --as DIRECTED --with-nodes "$AFewGoodMen")
printf '[%3d/253] %-10s %s -> %s\n' 40 'WROTE' 'Aaron Sorkin' 'A Few Good Men'
l=$(kg node "$AaronS" link --as WROTE --with-nodes "$AFewGoodMen")
printf '[%3d/171] %-6s %s\n' 30 'Movie' 'Top Gun'
TopGun=$(kg node new --with-labels Movie)
kg node "$TopGun" set title 'Top Gun' >/dev/null 2>&1
kg node "$TopGun" set released '1986' >/dev/null 2>&1
kg node "$TopGun" set tagline 'I feel the need, the need for ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 31 'Person' 'Kelly McGillis'
KellyM=$(kg node new --with-labels Person)
kg node "$KellyM" set name 'Kelly McGillis' >/dev/null 2>&1
kg node "$KellyM" set born '1957' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 32 'Person' 'Val Kilmer'
ValK=$(kg node new --with-labels Person)
kg node "$ValK" set name 'Val Kilmer' >/dev/null 2>&1
kg node "$ValK" set born '1959' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 33 'Person' 'Anthony Edwards'
AnthonyE=$(kg node new --with-labels Person)
kg node "$AnthonyE" set name 'Anthony Edwards' >/dev/null 2>&1
kg node "$AnthonyE" set born '1962' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 34 'Person' 'Tom Skerritt'
TomS=$(kg node new --with-labels Person)
kg node "$TomS" set name 'Tom Skerritt' >/dev/null 2>&1
kg node "$TomS" set born '1933' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 35 'Person' 'Meg Ryan'
MegR=$(kg node new --with-labels Person)
kg node "$MegR" set name 'Meg Ryan' >/dev/null 2>&1
kg node "$MegR" set born '1961' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 36 'Person' 'Tony Scott'
TonyS=$(kg node new --with-labels Person)
kg node "$TonyS" set name 'Tony Scott' >/dev/null 2>&1
kg node "$TonyS" set born '1944' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 37 'Person' 'Jim Cash'
JimC=$(kg node new --with-labels Person)
kg node "$JimC" set name 'Jim Cash' >/dev/null 2>&1
kg node "$JimC" set born '1941' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 41 'ACTED_IN' 'Tom Cruise' 'Top Gun'
l=$(kg node "$TomC" link --as ACTED_IN --with-nodes "$TopGun" --with-properties 'roles=Maverick')
printf '[%3d/253] %-10s %s -> %s\n' 42 'ACTED_IN' 'Kelly McGillis' 'Top Gun'
l=$(kg node "$KellyM" link --as ACTED_IN --with-nodes "$TopGun" --with-properties 'roles=Charlie')
printf '[%3d/253] %-10s %s -> %s\n' 43 'ACTED_IN' 'Val Kilmer' 'Top Gun'
l=$(kg node "$ValK" link --as ACTED_IN --with-nodes "$TopGun" --with-properties 'roles=Iceman')
printf '[%3d/253] %-10s %s -> %s\n' 44 'ACTED_IN' 'Anthony Edwards' 'Top Gun'
l=$(kg node "$AnthonyE" link --as ACTED_IN --with-nodes "$TopGun" --with-properties 'roles=Goose')
printf '[%3d/253] %-10s %s -> %s\n' 45 'ACTED_IN' 'Tom Skerritt' 'Top Gun'
l=$(kg node "$TomS" link --as ACTED_IN --with-nodes "$TopGun" --with-properties 'roles=Viper')
printf '[%3d/253] %-10s %s -> %s\n' 46 'ACTED_IN' 'Meg Ryan' 'Top Gun'
l=$(kg node "$MegR" link --as ACTED_IN --with-nodes "$TopGun" --with-properties 'roles=Carole')
printf '[%3d/253] %-10s %s -> %s\n' 47 'DIRECTED' 'Tony Scott' 'Top Gun'
l=$(kg node "$TonyS" link --as DIRECTED --with-nodes "$TopGun")
printf '[%3d/253] %-10s %s -> %s\n' 48 'WROTE' 'Jim Cash' 'Top Gun'
l=$(kg node "$JimC" link --as WROTE --with-nodes "$TopGun")
printf '[%3d/171] %-6s %s\n' 38 'Movie' 'Jerry Maguire'
JerryMaguire=$(kg node new --with-labels Movie)
kg node "$JerryMaguire" set title 'Jerry Maguire' >/dev/null 2>&1
kg node "$JerryMaguire" set released '2000' >/dev/null 2>&1
kg node "$JerryMaguire" set tagline 'The rest of his life begins ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 39 'Person' 'Renee Zellweger'
ReneeZ=$(kg node new --with-labels Person)
kg node "$ReneeZ" set name 'Renee Zellweger' >/dev/null 2>&1
kg node "$ReneeZ" set born '1969' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 40 'Person' 'Kelly Preston'
KellyP=$(kg node new --with-labels Person)
kg node "$KellyP" set name 'Kelly Preston' >/dev/null 2>&1
kg node "$KellyP" set born '1962' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 41 'Person' 'Jerry O'\''Connell'
JerryO=$(kg node new --with-labels Person)
kg node "$JerryO" set name 'Jerry O'\''Connell' >/dev/null 2>&1
kg node "$JerryO" set born '1974' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 42 'Person' 'Jay Mohr'
JayM=$(kg node new --with-labels Person)
kg node "$JayM" set name 'Jay Mohr' >/dev/null 2>&1
kg node "$JayM" set born '1970' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 43 'Person' 'Bonnie Hunt'
BonnieH=$(kg node new --with-labels Person)
kg node "$BonnieH" set name 'Bonnie Hunt' >/dev/null 2>&1
kg node "$BonnieH" set born '1961' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 44 'Person' 'Regina King'
ReginaK=$(kg node new --with-labels Person)
kg node "$ReginaK" set name 'Regina King' >/dev/null 2>&1
kg node "$ReginaK" set born '1971' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 45 'Person' 'Jonathan Lipnicki'
JonathanL=$(kg node new --with-labels Person)
kg node "$JonathanL" set name 'Jonathan Lipnicki' >/dev/null 2>&1
kg node "$JonathanL" set born '1996' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 46 'Person' 'Cameron Crowe'
CameronC=$(kg node new --with-labels Person)
kg node "$CameronC" set name 'Cameron Crowe' >/dev/null 2>&1
kg node "$CameronC" set born '1957' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 49 'ACTED_IN' 'Tom Cruise' 'Jerry Maguire'
l=$(kg node "$TomC" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Jerry Maguire')
printf '[%3d/253] %-10s %s -> %s\n' 50 'ACTED_IN' 'Cuba Gooding Jr.' 'Jerry Maguire'
l=$(kg node "$CubaG" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Rod Tidwell')
printf '[%3d/253] %-10s %s -> %s\n' 51 'ACTED_IN' 'Renee Zellweger' 'Jerry Maguire'
l=$(kg node "$ReneeZ" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Dorothy Boyd')
printf '[%3d/253] %-10s %s -> %s\n' 52 'ACTED_IN' 'Kelly Preston' 'Jerry Maguire'
l=$(kg node "$KellyP" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Avery Bishop')
printf '[%3d/253] %-10s %s -> %s\n' 53 'ACTED_IN' 'Jerry O'\''Connell' 'Jerry Maguire'
l=$(kg node "$JerryO" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Frank Cushman')
printf '[%3d/253] %-10s %s -> %s\n' 54 'ACTED_IN' 'Jay Mohr' 'Jerry Maguire'
l=$(kg node "$JayM" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Bob Sugar')
printf '[%3d/253] %-10s %s -> %s\n' 55 'ACTED_IN' 'Bonnie Hunt' 'Jerry Maguire'
l=$(kg node "$BonnieH" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Laurel Boyd')
printf '[%3d/253] %-10s %s -> %s\n' 56 'ACTED_IN' 'Regina King' 'Jerry Maguire'
l=$(kg node "$ReginaK" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Marcee Tidwell')
printf '[%3d/253] %-10s %s -> %s\n' 57 'ACTED_IN' 'Jonathan Lipnicki' 'Jerry Maguire'
l=$(kg node "$JonathanL" link --as ACTED_IN --with-nodes "$JerryMaguire" --with-properties 'roles=Ray Boyd')
printf '[%3d/253] %-10s %s -> %s\n' 58 'DIRECTED' 'Cameron Crowe' 'Jerry Maguire'
l=$(kg node "$CameronC" link --as DIRECTED --with-nodes "$JerryMaguire")
printf '[%3d/253] %-10s %s -> %s\n' 59 'PRODUCED' 'Cameron Crowe' 'Jerry Maguire'
l=$(kg node "$CameronC" link --as PRODUCED --with-nodes "$JerryMaguire")
printf '[%3d/253] %-10s %s -> %s\n' 60 'WROTE' 'Cameron Crowe' 'Jerry Maguire'
l=$(kg node "$CameronC" link --as WROTE --with-nodes "$JerryMaguire")
printf '[%3d/171] %-6s %s\n' 47 'Movie' 'Stand By Me'
StandByMe=$(kg node new --with-labels Movie)
kg node "$StandByMe" set title 'Stand By Me' >/dev/null 2>&1
kg node "$StandByMe" set released '1986' >/dev/null 2>&1
kg node "$StandByMe" set tagline 'For some, it'\''s the last real taste of innocence, and the first real taste of  But for everyone, it'\''s the time that memories are made ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 48 'Person' 'River Phoenix'
RiverP=$(kg node new --with-labels Person)
kg node "$RiverP" set name 'River Phoenix' >/dev/null 2>&1
kg node "$RiverP" set born '1970' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 49 'Person' 'Corey Feldman'
CoreyF=$(kg node new --with-labels Person)
kg node "$CoreyF" set name 'Corey Feldman' >/dev/null 2>&1
kg node "$CoreyF" set born '1971' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 50 'Person' 'Wil Wheaton'
WilW=$(kg node new --with-labels Person)
kg node "$WilW" set name 'Wil Wheaton' >/dev/null 2>&1
kg node "$WilW" set born '1972' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 51 'Person' 'John Cusack'
JohnC=$(kg node new --with-labels Person)
kg node "$JohnC" set name 'John Cusack' >/dev/null 2>&1
kg node "$JohnC" set born '1966' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 52 'Person' 'Marshall Bell'
MarshallB=$(kg node new --with-labels Person)
kg node "$MarshallB" set name 'Marshall Bell' >/dev/null 2>&1
kg node "$MarshallB" set born '1942' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 61 'ACTED_IN' 'Wil Wheaton' 'Stand By Me'
l=$(kg node "$WilW" link --as ACTED_IN --with-nodes "$StandByMe" --with-properties 'roles=Gordie Lachance')
printf '[%3d/253] %-10s %s -> %s\n' 62 'ACTED_IN' 'River Phoenix' 'Stand By Me'
l=$(kg node "$RiverP" link --as ACTED_IN --with-nodes "$StandByMe" --with-properties 'roles=Chris Chambers')
printf '[%3d/253] %-10s %s -> %s\n' 63 'ACTED_IN' 'Jerry O'\''Connell' 'Stand By Me'
l=$(kg node "$JerryO" link --as ACTED_IN --with-nodes "$StandByMe" --with-properties 'roles=Vern Tessio')
printf '[%3d/253] %-10s %s -> %s\n' 64 'ACTED_IN' 'Corey Feldman' 'Stand By Me'
l=$(kg node "$CoreyF" link --as ACTED_IN --with-nodes "$StandByMe" --with-properties 'roles=Teddy Duchamp')
printf '[%3d/253] %-10s %s -> %s\n' 65 'ACTED_IN' 'John Cusack' 'Stand By Me'
l=$(kg node "$JohnC" link --as ACTED_IN --with-nodes "$StandByMe" --with-properties 'roles=Denny Lachance')
printf '[%3d/253] %-10s %s -> %s\n' 66 'ACTED_IN' 'Kiefer Sutherland' 'Stand By Me'
l=$(kg node "$KieferS" link --as ACTED_IN --with-nodes "$StandByMe" --with-properties 'roles=Ace Merrill')
printf '[%3d/253] %-10s %s -> %s\n' 67 'ACTED_IN' 'Marshall Bell' 'Stand By Me'
l=$(kg node "$MarshallB" link --as ACTED_IN --with-nodes "$StandByMe" --with-properties 'roles=Mr. Lachance')
printf '[%3d/253] %-10s %s -> %s\n' 68 'DIRECTED' 'Rob Reiner' 'Stand By Me'
l=$(kg node "$RobR" link --as DIRECTED --with-nodes "$StandByMe")
printf '[%3d/171] %-6s %s\n' 53 'Movie' 'As Good as It Gets'
AsGoodAsItGets=$(kg node new --with-labels Movie)
kg node "$AsGoodAsItGets" set title 'As Good as It Gets' >/dev/null 2>&1
kg node "$AsGoodAsItGets" set released '1997' >/dev/null 2>&1
kg node "$AsGoodAsItGets" set tagline 'A comedy from the heart that goes for the ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 54 'Person' 'Helen Hunt'
HelenH=$(kg node new --with-labels Person)
kg node "$HelenH" set name 'Helen Hunt' >/dev/null 2>&1
kg node "$HelenH" set born '1963' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 55 'Person' 'Greg Kinnear'
GregK=$(kg node new --with-labels Person)
kg node "$GregK" set name 'Greg Kinnear' >/dev/null 2>&1
kg node "$GregK" set born '1963' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 56 'Person' 'James L. Brooks'
JamesB=$(kg node new --with-labels Person)
kg node "$JamesB" set name 'James L. Brooks' >/dev/null 2>&1
kg node "$JamesB" set born '1940' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 69 'ACTED_IN' 'Jack Nicholson' 'As Good as It Gets'
l=$(kg node "$JackN" link --as ACTED_IN --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Melvin Udall')
printf '[%3d/253] %-10s %s -> %s\n' 70 'ACTED_IN' 'Helen Hunt' 'As Good as It Gets'
l=$(kg node "$HelenH" link --as ACTED_IN --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Carol Connelly')
printf '[%3d/253] %-10s %s -> %s\n' 71 'ACTED_IN' 'Greg Kinnear' 'As Good as It Gets'
l=$(kg node "$GregK" link --as ACTED_IN --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Simon Bishop')
printf '[%3d/253] %-10s %s -> %s\n' 72 'ACTED_IN' 'Cuba Gooding Jr.' 'As Good as It Gets'
l=$(kg node "$CubaG" link --as ACTED_IN --with-nodes "$AsGoodAsItGets" --with-properties 'roles=Frank Sachs')
printf '[%3d/253] %-10s %s -> %s\n' 73 'DIRECTED' 'James L. Brooks' 'As Good as It Gets'
l=$(kg node "$JamesB" link --as DIRECTED --with-nodes "$AsGoodAsItGets")
printf '[%3d/171] %-6s %s\n' 57 'Movie' 'What Dreams May Come'
WhatDreamsMayCome=$(kg node new --with-labels Movie)
kg node "$WhatDreamsMayCome" set title 'What Dreams May Come' >/dev/null 2>&1
kg node "$WhatDreamsMayCome" set released '1998' >/dev/null 2>&1
kg node "$WhatDreamsMayCome" set tagline 'After life there is  The end is just the ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 58 'Person' 'Annabella Sciorra'
AnnabellaS=$(kg node new --with-labels Person)
kg node "$AnnabellaS" set name 'Annabella Sciorra' >/dev/null 2>&1
kg node "$AnnabellaS" set born '1960' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 59 'Person' 'Max von Sydow'
MaxS=$(kg node new --with-labels Person)
kg node "$MaxS" set name 'Max von Sydow' >/dev/null 2>&1
kg node "$MaxS" set born '1929' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 60 'Person' 'Werner Herzog'
WernerH=$(kg node new --with-labels Person)
kg node "$WernerH" set name 'Werner Herzog' >/dev/null 2>&1
kg node "$WernerH" set born '1942' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 61 'Person' 'Robin Williams'
Robin=$(kg node new --with-labels Person)
kg node "$Robin" set name 'Robin Williams' >/dev/null 2>&1
kg node "$Robin" set born '1951' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 62 'Person' 'Vincent Ward'
VincentW=$(kg node new --with-labels Person)
kg node "$VincentW" set name 'Vincent Ward' >/dev/null 2>&1
kg node "$VincentW" set born '1956' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 74 'ACTED_IN' 'Robin Williams' 'What Dreams May Come'
l=$(kg node "$Robin" link --as ACTED_IN --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=Chris Nielsen')
printf '[%3d/253] %-10s %s -> %s\n' 75 'ACTED_IN' 'Cuba Gooding Jr.' 'What Dreams May Come'
l=$(kg node "$CubaG" link --as ACTED_IN --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=Albert Lewis')
printf '[%3d/253] %-10s %s -> %s\n' 76 'ACTED_IN' 'Annabella Sciorra' 'What Dreams May Come'
l=$(kg node "$AnnabellaS" link --as ACTED_IN --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=Annie Collins-Nielsen')
printf '[%3d/253] %-10s %s -> %s\n' 77 'ACTED_IN' 'Max von Sydow' 'What Dreams May Come'
l=$(kg node "$MaxS" link --as ACTED_IN --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=The Tracker')
printf '[%3d/253] %-10s %s -> %s\n' 78 'ACTED_IN' 'Werner Herzog' 'What Dreams May Come'
l=$(kg node "$WernerH" link --as ACTED_IN --with-nodes "$WhatDreamsMayCome" --with-properties 'roles=The Face')
printf '[%3d/253] %-10s %s -> %s\n' 79 'DIRECTED' 'Vincent Ward' 'What Dreams May Come'
l=$(kg node "$VincentW" link --as DIRECTED --with-nodes "$WhatDreamsMayCome")
printf '[%3d/171] %-6s %s\n' 63 'Movie' 'Snow Falling on Cedars'
SnowFallingonCedars=$(kg node new --with-labels Movie)
kg node "$SnowFallingonCedars" set title 'Snow Falling on Cedars' >/dev/null 2>&1
kg node "$SnowFallingonCedars" set released '1999' >/dev/null 2>&1
kg node "$SnowFallingonCedars" set tagline 'First loves  ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 64 'Person' 'Ethan Hawke'
EthanH=$(kg node new --with-labels Person)
kg node "$EthanH" set name 'Ethan Hawke' >/dev/null 2>&1
kg node "$EthanH" set born '1970' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 65 'Person' 'Rick Yune'
RickY=$(kg node new --with-labels Person)
kg node "$RickY" set name 'Rick Yune' >/dev/null 2>&1
kg node "$RickY" set born '1971' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 66 'Person' 'James Cromwell'
JamesC=$(kg node new --with-labels Person)
kg node "$JamesC" set name 'James Cromwell' >/dev/null 2>&1
kg node "$JamesC" set born '1940' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 67 'Person' 'Scott Hicks'
ScottH=$(kg node new --with-labels Person)
kg node "$ScottH" set name 'Scott Hicks' >/dev/null 2>&1
kg node "$ScottH" set born '1953' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 80 'ACTED_IN' 'Ethan Hawke' 'Snow Falling on Cedars'
l=$(kg node "$EthanH" link --as ACTED_IN --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Ishmael Chambers')
printf '[%3d/253] %-10s %s -> %s\n' 81 'ACTED_IN' 'Rick Yune' 'Snow Falling on Cedars'
l=$(kg node "$RickY" link --as ACTED_IN --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Kazuo Miyamoto')
printf '[%3d/253] %-10s %s -> %s\n' 82 'ACTED_IN' 'Max von Sydow' 'Snow Falling on Cedars'
l=$(kg node "$MaxS" link --as ACTED_IN --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Nels Gudmundsson')
printf '[%3d/253] %-10s %s -> %s\n' 83 'ACTED_IN' 'James Cromwell' 'Snow Falling on Cedars'
l=$(kg node "$JamesC" link --as ACTED_IN --with-nodes "$SnowFallingonCedars" --with-properties 'roles=Judge Fielding')
printf '[%3d/253] %-10s %s -> %s\n' 84 'DIRECTED' 'Scott Hicks' 'Snow Falling on Cedars'
l=$(kg node "$ScottH" link --as DIRECTED --with-nodes "$SnowFallingonCedars")
printf '[%3d/171] %-6s %s\n' 68 'Movie' 'You'\''ve Got Mail'
YouveGotMail=$(kg node new --with-labels Movie)
kg node "$YouveGotMail" set title 'You'\''ve Got Mail' >/dev/null 2>&1
kg node "$YouveGotMail" set released '1998' >/dev/null 2>&1
kg node "$YouveGotMail" set tagline 'At odds in .. in love on-' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 69 'Person' 'Tom Hanks'
TomH=$(kg node new --with-labels Person)
kg node "$TomH" set name 'Tom Hanks' >/dev/null 2>&1
kg node "$TomH" set born '1956' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 70 'Person' 'Parker Posey'
ParkerP=$(kg node new --with-labels Person)
kg node "$ParkerP" set name 'Parker Posey' >/dev/null 2>&1
kg node "$ParkerP" set born '1968' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 71 'Person' 'Dave Chappelle'
DaveC=$(kg node new --with-labels Person)
kg node "$DaveC" set name 'Dave Chappelle' >/dev/null 2>&1
kg node "$DaveC" set born '1973' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 72 'Person' 'Steve Zahn'
SteveZ=$(kg node new --with-labels Person)
kg node "$SteveZ" set name 'Steve Zahn' >/dev/null 2>&1
kg node "$SteveZ" set born '1967' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 73 'Person' 'Nora Ephron'
NoraE=$(kg node new --with-labels Person)
kg node "$NoraE" set name 'Nora Ephron' >/dev/null 2>&1
kg node "$NoraE" set born '1941' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 85 'ACTED_IN' 'Tom Hanks' 'You'\''ve Got Mail'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$YouveGotMail" --with-properties 'roles=Joe Fox')
printf '[%3d/253] %-10s %s -> %s\n' 86 'ACTED_IN' 'Meg Ryan' 'You'\''ve Got Mail'
l=$(kg node "$MegR" link --as ACTED_IN --with-nodes "$YouveGotMail" --with-properties 'roles=Kathleen Kelly')
printf '[%3d/253] %-10s %s -> %s\n' 87 'ACTED_IN' 'Greg Kinnear' 'You'\''ve Got Mail'
l=$(kg node "$GregK" link --as ACTED_IN --with-nodes "$YouveGotMail" --with-properties 'roles=Frank Navasky')
printf '[%3d/253] %-10s %s -> %s\n' 88 'ACTED_IN' 'Parker Posey' 'You'\''ve Got Mail'
l=$(kg node "$ParkerP" link --as ACTED_IN --with-nodes "$YouveGotMail" --with-properties 'roles=Patricia Eden')
printf '[%3d/253] %-10s %s -> %s\n' 89 'ACTED_IN' 'Dave Chappelle' 'You'\''ve Got Mail'
l=$(kg node "$DaveC" link --as ACTED_IN --with-nodes "$YouveGotMail" --with-properties 'roles=Kevin Jackson')
printf '[%3d/253] %-10s %s -> %s\n' 90 'ACTED_IN' 'Steve Zahn' 'You'\''ve Got Mail'
l=$(kg node "$SteveZ" link --as ACTED_IN --with-nodes "$YouveGotMail" --with-properties 'roles=George Pappas')
printf '[%3d/253] %-10s %s -> %s\n' 91 'DIRECTED' 'Nora Ephron' 'You'\''ve Got Mail'
l=$(kg node "$NoraE" link --as DIRECTED --with-nodes "$YouveGotMail")
printf '[%3d/171] %-6s %s\n' 74 'Movie' 'Sleepless in Seattle'
SleeplessInSeattle=$(kg node new --with-labels Movie)
kg node "$SleeplessInSeattle" set title 'Sleepless in Seattle' >/dev/null 2>&1
kg node "$SleeplessInSeattle" set released '1993' >/dev/null 2>&1
kg node "$SleeplessInSeattle" set tagline 'What if someone you never met, someone you never saw, someone you never knew was the only someone for you?' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 75 'Person' 'Rita Wilson'
RitaW=$(kg node new --with-labels Person)
kg node "$RitaW" set name 'Rita Wilson' >/dev/null 2>&1
kg node "$RitaW" set born '1956' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 76 'Person' 'Bill Pullman'
BillPull=$(kg node new --with-labels Person)
kg node "$BillPull" set name 'Bill Pullman' >/dev/null 2>&1
kg node "$BillPull" set born '1953' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 77 'Person' 'Victor Garber'
VictorG=$(kg node new --with-labels Person)
kg node "$VictorG" set name 'Victor Garber' >/dev/null 2>&1
kg node "$VictorG" set born '1949' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 78 'Person' 'Rosie O'\''Donnell'
RosieO=$(kg node new --with-labels Person)
kg node "$RosieO" set name 'Rosie O'\''Donnell' >/dev/null 2>&1
kg node "$RosieO" set born '1962' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 92 'ACTED_IN' 'Tom Hanks' 'Sleepless in Seattle'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Sam Baldwin')
printf '[%3d/253] %-10s %s -> %s\n' 93 'ACTED_IN' 'Meg Ryan' 'Sleepless in Seattle'
l=$(kg node "$MegR" link --as ACTED_IN --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Annie Reed')
printf '[%3d/253] %-10s %s -> %s\n' 94 'ACTED_IN' 'Rita Wilson' 'Sleepless in Seattle'
l=$(kg node "$RitaW" link --as ACTED_IN --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Suzy')
printf '[%3d/253] %-10s %s -> %s\n' 95 'ACTED_IN' 'Bill Pullman' 'Sleepless in Seattle'
l=$(kg node "$BillPull" link --as ACTED_IN --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Walter')
printf '[%3d/253] %-10s %s -> %s\n' 96 'ACTED_IN' 'Victor Garber' 'Sleepless in Seattle'
l=$(kg node "$VictorG" link --as ACTED_IN --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Greg')
printf '[%3d/253] %-10s %s -> %s\n' 97 'ACTED_IN' 'Rosie O'\''Donnell' 'Sleepless in Seattle'
l=$(kg node "$RosieO" link --as ACTED_IN --with-nodes "$SleeplessInSeattle" --with-properties 'roles=Becky')
printf '[%3d/253] %-10s %s -> %s\n' 98 'DIRECTED' 'Nora Ephron' 'Sleepless in Seattle'
l=$(kg node "$NoraE" link --as DIRECTED --with-nodes "$SleeplessInSeattle")
printf '[%3d/171] %-6s %s\n' 79 'Movie' 'Joe Versus the Volcano'
JoeVersustheVolcano=$(kg node new --with-labels Movie)
kg node "$JoeVersustheVolcano" set title 'Joe Versus the Volcano' >/dev/null 2>&1
kg node "$JoeVersustheVolcano" set released '1990' >/dev/null 2>&1
kg node "$JoeVersustheVolcano" set tagline 'A story of love, lava and burning ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 80 'Person' 'John Patrick Stanley'
JohnS=$(kg node new --with-labels Person)
kg node "$JohnS" set name 'John Patrick Stanley' >/dev/null 2>&1
kg node "$JohnS" set born '1950' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 81 'Person' 'Nathan Lane'
Nathan=$(kg node new --with-labels Person)
kg node "$Nathan" set name 'Nathan Lane' >/dev/null 2>&1
kg node "$Nathan" set born '1956' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 99 'ACTED_IN' 'Tom Hanks' 'Joe Versus the Volcano'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$JoeVersustheVolcano" --with-properties 'roles=Joe Banks')
printf '[%3d/253] %-10s %s -> %s\n' 100 'ACTED_IN' 'Meg Ryan' 'Joe Versus the Volcano'
l=$(kg node "$MegR" link --as ACTED_IN --with-nodes "$JoeVersustheVolcano")
kg link "$l" add roles 'DeDe' 'Angelica Graynamore' 'Patricia Graynamore' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 101 'ACTED_IN' 'Nathan Lane' 'Joe Versus the Volcano'
l=$(kg node "$Nathan" link --as ACTED_IN --with-nodes "$JoeVersustheVolcano" --with-properties 'roles=Baw')
printf '[%3d/253] %-10s %s -> %s\n' 102 'DIRECTED' 'John Patrick Stanley' 'Joe Versus the Volcano'
l=$(kg node "$JohnS" link --as DIRECTED --with-nodes "$JoeVersustheVolcano")
printf '[%3d/171] %-6s %s\n' 82 'Movie' 'When Harry Met Sally'
WhenHarryMetSally=$(kg node new --with-labels Movie)
kg node "$WhenHarryMetSally" set title 'When Harry Met Sally' >/dev/null 2>&1
kg node "$WhenHarryMetSally" set released '1998' >/dev/null 2>&1
kg node "$WhenHarryMetSally" set tagline 'Can two friends sleep together and still love each other in the morning?' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 83 'Person' 'Billy Crystal'
BillyC=$(kg node new --with-labels Person)
kg node "$BillyC" set name 'Billy Crystal' >/dev/null 2>&1
kg node "$BillyC" set born '1948' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 84 'Person' 'Carrie Fisher'
CarrieF=$(kg node new --with-labels Person)
kg node "$CarrieF" set name 'Carrie Fisher' >/dev/null 2>&1
kg node "$CarrieF" set born '1956' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 85 'Person' 'Bruno Kirby'
BrunoK=$(kg node new --with-labels Person)
kg node "$BrunoK" set name 'Bruno Kirby' >/dev/null 2>&1
kg node "$BrunoK" set born '1949' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 103 'ACTED_IN' 'Billy Crystal' 'When Harry Met Sally'
l=$(kg node "$BillyC" link --as ACTED_IN --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Harry Burns')
printf '[%3d/253] %-10s %s -> %s\n' 104 'ACTED_IN' 'Meg Ryan' 'When Harry Met Sally'
l=$(kg node "$MegR" link --as ACTED_IN --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Sally Albright')
printf '[%3d/253] %-10s %s -> %s\n' 105 'ACTED_IN' 'Carrie Fisher' 'When Harry Met Sally'
l=$(kg node "$CarrieF" link --as ACTED_IN --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Marie')
printf '[%3d/253] %-10s %s -> %s\n' 106 'ACTED_IN' 'Bruno Kirby' 'When Harry Met Sally'
l=$(kg node "$BrunoK" link --as ACTED_IN --with-nodes "$WhenHarryMetSally" --with-properties 'roles=Jess')
printf '[%3d/253] %-10s %s -> %s\n' 107 'DIRECTED' 'Rob Reiner' 'When Harry Met Sally'
l=$(kg node "$RobR" link --as DIRECTED --with-nodes "$WhenHarryMetSally")
printf '[%3d/253] %-10s %s -> %s\n' 108 'PRODUCED' 'Rob Reiner' 'When Harry Met Sally'
l=$(kg node "$RobR" link --as PRODUCED --with-nodes "$WhenHarryMetSally")
printf '[%3d/253] %-10s %s -> %s\n' 109 'PRODUCED' 'Nora Ephron' 'When Harry Met Sally'
l=$(kg node "$NoraE" link --as PRODUCED --with-nodes "$WhenHarryMetSally")
printf '[%3d/253] %-10s %s -> %s\n' 110 'WROTE' 'Nora Ephron' 'When Harry Met Sally'
l=$(kg node "$NoraE" link --as WROTE --with-nodes "$WhenHarryMetSally")
printf '[%3d/171] %-6s %s\n' 86 'Movie' 'That Thing You Do'
ThatThingYouDo=$(kg node new --with-labels Movie)
kg node "$ThatThingYouDo" set title 'That Thing You Do' >/dev/null 2>&1
kg node "$ThatThingYouDo" set released '1996' >/dev/null 2>&1
kg node "$ThatThingYouDo" set tagline 'In every life there comes a time when that thing you dream becomes that thing you do' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 87 'Person' 'Liv Tyler'
LivT=$(kg node new --with-labels Person)
kg node "$LivT" set name 'Liv Tyler' >/dev/null 2>&1
kg node "$LivT" set born '1977' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 111 'ACTED_IN' 'Tom Hanks' 'That Thing You Do'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$ThatThingYouDo" --with-properties 'roles=Mr. White')
printf '[%3d/253] %-10s %s -> %s\n' 112 'ACTED_IN' 'Liv Tyler' 'That Thing You Do'
l=$(kg node "$LivT" link --as ACTED_IN --with-nodes "$ThatThingYouDo" --with-properties 'roles=Faye Dolan')
printf '[%3d/253] %-10s %s -> %s\n' 113 'ACTED_IN' 'Charlize Theron' 'That Thing You Do'
l=$(kg node "$Charlize" link --as ACTED_IN --with-nodes "$ThatThingYouDo" --with-properties 'roles=Tina')
printf '[%3d/253] %-10s %s -> %s\n' 114 'DIRECTED' 'Tom Hanks' 'That Thing You Do'
l=$(kg node "$TomH" link --as DIRECTED --with-nodes "$ThatThingYouDo")
printf '[%3d/171] %-6s %s\n' 88 'Movie' 'The Replacements'
TheReplacements=$(kg node new --with-labels Movie)
kg node "$TheReplacements" set title 'The Replacements' >/dev/null 2>&1
kg node "$TheReplacements" set released '2000' >/dev/null 2>&1
kg node "$TheReplacements" set tagline 'Pain heals, Chicks dig .. Glory lasts forever' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 89 'Person' 'Brooke Langton'
Brooke=$(kg node new --with-labels Person)
kg node "$Brooke" set name 'Brooke Langton' >/dev/null 2>&1
kg node "$Brooke" set born '1970' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 90 'Person' 'Gene Hackman'
Gene=$(kg node new --with-labels Person)
kg node "$Gene" set name 'Gene Hackman' >/dev/null 2>&1
kg node "$Gene" set born '1930' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 91 'Person' 'Orlando Jones'
Orlando=$(kg node new --with-labels Person)
kg node "$Orlando" set name 'Orlando Jones' >/dev/null 2>&1
kg node "$Orlando" set born '1968' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 92 'Person' 'Howard Deutch'
Howard=$(kg node new --with-labels Person)
kg node "$Howard" set name 'Howard Deutch' >/dev/null 2>&1
kg node "$Howard" set born '1950' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 115 'ACTED_IN' 'Keanu Reeves' 'The Replacements'
l=$(kg node "$Keanu" link --as ACTED_IN --with-nodes "$TheReplacements" --with-properties 'roles=Shane Falco')
printf '[%3d/253] %-10s %s -> %s\n' 116 'ACTED_IN' 'Brooke Langton' 'The Replacements'
l=$(kg node "$Brooke" link --as ACTED_IN --with-nodes "$TheReplacements" --with-properties 'roles=Annabelle Farrell')
printf '[%3d/253] %-10s %s -> %s\n' 117 'ACTED_IN' 'Gene Hackman' 'The Replacements'
l=$(kg node "$Gene" link --as ACTED_IN --with-nodes "$TheReplacements" --with-properties 'roles=Jimmy McGinty')
printf '[%3d/253] %-10s %s -> %s\n' 118 'ACTED_IN' 'Orlando Jones' 'The Replacements'
l=$(kg node "$Orlando" link --as ACTED_IN --with-nodes "$TheReplacements" --with-properties 'roles=Clifford Franklin')
printf '[%3d/253] %-10s %s -> %s\n' 119 'DIRECTED' 'Howard Deutch' 'The Replacements'
l=$(kg node "$Howard" link --as DIRECTED --with-nodes "$TheReplacements")
printf '[%3d/171] %-6s %s\n' 93 'Movie' 'RescueDawn'
RescueDawn=$(kg node new --with-labels Movie)
kg node "$RescueDawn" set title 'RescueDawn' >/dev/null 2>&1
kg node "$RescueDawn" set released '2006' >/dev/null 2>&1
kg node "$RescueDawn" set tagline 'Based on the extraordinary true story of one man'\''s fight for freedom' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 94 'Person' 'Christian Bale'
ChristianB=$(kg node new --with-labels Person)
kg node "$ChristianB" set name 'Christian Bale' >/dev/null 2>&1
kg node "$ChristianB" set born '1974' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 95 'Person' 'Zach Grenier'
ZachG=$(kg node new --with-labels Person)
kg node "$ZachG" set name 'Zach Grenier' >/dev/null 2>&1
kg node "$ZachG" set born '1954' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 120 'ACTED_IN' 'Marshall Bell' 'RescueDawn'
l=$(kg node "$MarshallB" link --as ACTED_IN --with-nodes "$RescueDawn" --with-properties 'roles=Admiral')
printf '[%3d/253] %-10s %s -> %s\n' 121 'ACTED_IN' 'Christian Bale' 'RescueDawn'
l=$(kg node "$ChristianB" link --as ACTED_IN --with-nodes "$RescueDawn" --with-properties 'roles=Dieter Dengler')
printf '[%3d/253] %-10s %s -> %s\n' 122 'ACTED_IN' 'Zach Grenier' 'RescueDawn'
l=$(kg node "$ZachG" link --as ACTED_IN --with-nodes "$RescueDawn" --with-properties 'roles=Squad Leader')
printf '[%3d/253] %-10s %s -> %s\n' 123 'ACTED_IN' 'Steve Zahn' 'RescueDawn'
l=$(kg node "$SteveZ" link --as ACTED_IN --with-nodes "$RescueDawn" --with-properties 'roles=Duane')
printf '[%3d/253] %-10s %s -> %s\n' 124 'DIRECTED' 'Werner Herzog' 'RescueDawn'
l=$(kg node "$WernerH" link --as DIRECTED --with-nodes "$RescueDawn")
printf '[%3d/171] %-6s %s\n' 96 'Movie' 'The Birdcage'
TheBirdcage=$(kg node new --with-labels Movie)
kg node "$TheBirdcage" set title 'The Birdcage' >/dev/null 2>&1
kg node "$TheBirdcage" set released '1996' >/dev/null 2>&1
kg node "$TheBirdcage" set tagline 'Come as you are' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 97 'Person' 'Mike Nichols'
MikeN=$(kg node new --with-labels Person)
kg node "$MikeN" set name 'Mike Nichols' >/dev/null 2>&1
kg node "$MikeN" set born '1931' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 125 'ACTED_IN' 'Robin Williams' 'The Birdcage'
l=$(kg node "$Robin" link --as ACTED_IN --with-nodes "$TheBirdcage" --with-properties 'roles=Armand Goldman')
printf '[%3d/253] %-10s %s -> %s\n' 126 'ACTED_IN' 'Nathan Lane' 'The Birdcage'
l=$(kg node "$Nathan" link --as ACTED_IN --with-nodes "$TheBirdcage" --with-properties 'roles=Albert Goldman')
printf '[%3d/253] %-10s %s -> %s\n' 127 'ACTED_IN' 'Gene Hackman' 'The Birdcage'
l=$(kg node "$Gene" link --as ACTED_IN --with-nodes "$TheBirdcage" --with-properties 'roles=Sen. Kevin Keeley')
printf '[%3d/253] %-10s %s -> %s\n' 128 'DIRECTED' 'Mike Nichols' 'The Birdcage'
l=$(kg node "$MikeN" link --as DIRECTED --with-nodes "$TheBirdcage")
printf '[%3d/171] %-6s %s\n' 98 'Movie' 'Unforgiven'
Unforgiven=$(kg node new --with-labels Movie)
kg node "$Unforgiven" set title 'Unforgiven' >/dev/null 2>&1
kg node "$Unforgiven" set released '1992' >/dev/null 2>&1
kg node "$Unforgiven" set tagline 'It'\''s a hell of a thing, killing a man' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 99 'Person' 'Richard Harris'
RichardH=$(kg node new --with-labels Person)
kg node "$RichardH" set name 'Richard Harris' >/dev/null 2>&1
kg node "$RichardH" set born '1930' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 100 'Person' 'Clint Eastwood'
ClintE=$(kg node new --with-labels Person)
kg node "$ClintE" set name 'Clint Eastwood' >/dev/null 2>&1
kg node "$ClintE" set born '1930' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 129 'ACTED_IN' 'Richard Harris' 'Unforgiven'
l=$(kg node "$RichardH" link --as ACTED_IN --with-nodes "$Unforgiven" --with-properties 'roles=English Bob')
printf '[%3d/253] %-10s %s -> %s\n' 130 'ACTED_IN' 'Clint Eastwood' 'Unforgiven'
l=$(kg node "$ClintE" link --as ACTED_IN --with-nodes "$Unforgiven" --with-properties 'roles=Bill Munny')
printf '[%3d/253] %-10s %s -> %s\n' 131 'ACTED_IN' 'Gene Hackman' 'Unforgiven'
l=$(kg node "$Gene" link --as ACTED_IN --with-nodes "$Unforgiven" --with-properties 'roles=Little Bill Daggett')
printf '[%3d/253] %-10s %s -> %s\n' 132 'DIRECTED' 'Clint Eastwood' 'Unforgiven'
l=$(kg node "$ClintE" link --as DIRECTED --with-nodes "$Unforgiven")
printf '[%3d/171] %-6s %s\n' 101 'Movie' 'Johnny Mnemonic'
JohnnyMnemonic=$(kg node new --with-labels Movie)
kg node "$JohnnyMnemonic" set title 'Johnny Mnemonic' >/dev/null 2>&1
kg node "$JohnnyMnemonic" set released '1995' >/dev/null 2>&1
kg node "$JohnnyMnemonic" set tagline 'The hottest data on  In the coolest head in town' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 102 'Person' 'Takeshi Kitano'
Takeshi=$(kg node new --with-labels Person)
kg node "$Takeshi" set name 'Takeshi Kitano' >/dev/null 2>&1
kg node "$Takeshi" set born '1947' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 103 'Person' 'Dina Meyer'
Dina=$(kg node new --with-labels Person)
kg node "$Dina" set name 'Dina Meyer' >/dev/null 2>&1
kg node "$Dina" set born '1968' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 104 'Person' 'Ice-T'
IceT=$(kg node new --with-labels Person)
kg node "$IceT" set name 'Ice-T' >/dev/null 2>&1
kg node "$IceT" set born '1958' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 105 'Person' 'Robert Longo'
RobertL=$(kg node new --with-labels Person)
kg node "$RobertL" set name 'Robert Longo' >/dev/null 2>&1
kg node "$RobertL" set born '1953' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 133 'ACTED_IN' 'Keanu Reeves' 'Johnny Mnemonic'
l=$(kg node "$Keanu" link --as ACTED_IN --with-nodes "$JohnnyMnemonic" --with-properties 'roles=Johnny Mnemonic')
printf '[%3d/253] %-10s %s -> %s\n' 134 'ACTED_IN' 'Takeshi Kitano' 'Johnny Mnemonic'
l=$(kg node "$Takeshi" link --as ACTED_IN --with-nodes "$JohnnyMnemonic" --with-properties 'roles=Takahashi')
printf '[%3d/253] %-10s %s -> %s\n' 135 'ACTED_IN' 'Dina Meyer' 'Johnny Mnemonic'
l=$(kg node "$Dina" link --as ACTED_IN --with-nodes "$JohnnyMnemonic" --with-properties 'roles=Jane')
printf '[%3d/253] %-10s %s -> %s\n' 136 'ACTED_IN' 'Ice-T' 'Johnny Mnemonic'
l=$(kg node "$IceT" link --as ACTED_IN --with-nodes "$JohnnyMnemonic" --with-properties 'roles=J-Bone')
printf '[%3d/253] %-10s %s -> %s\n' 137 'DIRECTED' 'Robert Longo' 'Johnny Mnemonic'
l=$(kg node "$RobertL" link --as DIRECTED --with-nodes "$JohnnyMnemonic")
printf '[%3d/171] %-6s %s\n' 106 'Movie' 'Cloud Atlas'
CloudAtlas=$(kg node new --with-labels Movie)
kg node "$CloudAtlas" set title 'Cloud Atlas' >/dev/null 2>&1
kg node "$CloudAtlas" set released '2012' >/dev/null 2>&1
kg node "$CloudAtlas" set tagline 'Everything is connected' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 107 'Person' 'Halle Berry'
HalleB=$(kg node new --with-labels Person)
kg node "$HalleB" set name 'Halle Berry' >/dev/null 2>&1
kg node "$HalleB" set born '1966' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 108 'Person' 'Jim Broadbent'
JimB=$(kg node new --with-labels Person)
kg node "$JimB" set name 'Jim Broadbent' >/dev/null 2>&1
kg node "$JimB" set born '1949' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 109 'Person' 'Tom Tykwer'
TomT=$(kg node new --with-labels Person)
kg node "$TomT" set name 'Tom Tykwer' >/dev/null 2>&1
kg node "$TomT" set born '1965' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 110 'Person' 'David Mitchell'
DavidMitchell=$(kg node new --with-labels Person)
kg node "$DavidMitchell" set name 'David Mitchell' >/dev/null 2>&1
kg node "$DavidMitchell" set born '1969' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 111 'Person' 'Stefan Arndt'
StefanArndt=$(kg node new --with-labels Person)
kg node "$StefanArndt" set name 'Stefan Arndt' >/dev/null 2>&1
kg node "$StefanArndt" set born '1961' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 138 'ACTED_IN' 'Tom Hanks' 'Cloud Atlas'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Zachry' 'Dr. Henry Goose' 'Isaac Sachs' 'Dermot Hoggins' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 139 'ACTED_IN' 'Hugo Weaving' 'Cloud Atlas'
l=$(kg node "$Hugo" link --as ACTED_IN --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Bill Smoke' 'Haskell Moore' 'Tadeusz Kesselring' 'Nurse Noakes' 'Boardman Mephi' 'Old Georgie' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 140 'ACTED_IN' 'Halle Berry' 'Cloud Atlas'
l=$(kg node "$HalleB" link --as ACTED_IN --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Luisa Rey' 'Jocasta Ayrs' 'Ovid' 'Meronym' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 141 'ACTED_IN' 'Jim Broadbent' 'Cloud Atlas'
l=$(kg node "$JimB" link --as ACTED_IN --with-nodes "$CloudAtlas")
kg link "$l" add roles 'Vyvyan Ayrs' 'Captain Molyneux' 'Timothy Cavendish' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 142 'DIRECTED' 'Tom Tykwer' 'Cloud Atlas'
l=$(kg node "$TomT" link --as DIRECTED --with-nodes "$CloudAtlas")
printf '[%3d/253] %-10s %s -> %s\n' 143 'DIRECTED' 'Lilly Wachowski' 'Cloud Atlas'
l=$(kg node "$LillyW" link --as DIRECTED --with-nodes "$CloudAtlas")
printf '[%3d/253] %-10s %s -> %s\n' 144 'DIRECTED' 'Lana Wachowski' 'Cloud Atlas'
l=$(kg node "$LanaW" link --as DIRECTED --with-nodes "$CloudAtlas")
printf '[%3d/253] %-10s %s -> %s\n' 145 'WROTE' 'David Mitchell' 'Cloud Atlas'
l=$(kg node "$DavidMitchell" link --as WROTE --with-nodes "$CloudAtlas")
printf '[%3d/253] %-10s %s -> %s\n' 146 'PRODUCED' 'Stefan Arndt' 'Cloud Atlas'
l=$(kg node "$StefanArndt" link --as PRODUCED --with-nodes "$CloudAtlas")
printf '[%3d/171] %-6s %s\n' 112 'Movie' 'The Da Vinci Code'
TheDaVinciCode=$(kg node new --with-labels Movie)
kg node "$TheDaVinciCode" set title 'The Da Vinci Code' >/dev/null 2>&1
kg node "$TheDaVinciCode" set released '2006' >/dev/null 2>&1
kg node "$TheDaVinciCode" set tagline 'Break The Codes' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 113 'Person' 'Ian McKellen'
IanM=$(kg node new --with-labels Person)
kg node "$IanM" set name 'Ian McKellen' >/dev/null 2>&1
kg node "$IanM" set born '1939' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 114 'Person' 'Audrey Tautou'
AudreyT=$(kg node new --with-labels Person)
kg node "$AudreyT" set name 'Audrey Tautou' >/dev/null 2>&1
kg node "$AudreyT" set born '1976' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 115 'Person' 'Paul Bettany'
PaulB=$(kg node new --with-labels Person)
kg node "$PaulB" set name 'Paul Bettany' >/dev/null 2>&1
kg node "$PaulB" set born '1971' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 116 'Person' 'Ron Howard'
RonH=$(kg node new --with-labels Person)
kg node "$RonH" set name 'Ron Howard' >/dev/null 2>&1
kg node "$RonH" set born '1954' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 147 'ACTED_IN' 'Tom Hanks' 'The Da Vinci Code'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$TheDaVinciCode" --with-properties 'roles=Dr. Robert Langdon')
printf '[%3d/253] %-10s %s -> %s\n' 148 'ACTED_IN' 'Ian McKellen' 'The Da Vinci Code'
l=$(kg node "$IanM" link --as ACTED_IN --with-nodes "$TheDaVinciCode" --with-properties 'roles=Sir Leight Teabing')
printf '[%3d/253] %-10s %s -> %s\n' 149 'ACTED_IN' 'Audrey Tautou' 'The Da Vinci Code'
l=$(kg node "$AudreyT" link --as ACTED_IN --with-nodes "$TheDaVinciCode" --with-properties 'roles=Sophie Neveu')
printf '[%3d/253] %-10s %s -> %s\n' 150 'ACTED_IN' 'Paul Bettany' 'The Da Vinci Code'
l=$(kg node "$PaulB" link --as ACTED_IN --with-nodes "$TheDaVinciCode" --with-properties 'roles=Silas')
printf '[%3d/253] %-10s %s -> %s\n' 151 'DIRECTED' 'Ron Howard' 'The Da Vinci Code'
l=$(kg node "$RonH" link --as DIRECTED --with-nodes "$TheDaVinciCode")
printf '[%3d/171] %-6s %s\n' 117 'Movie' 'V for Vendetta'
VforVendetta=$(kg node new --with-labels Movie)
kg node "$VforVendetta" set title 'V for Vendetta' >/dev/null 2>&1
kg node "$VforVendetta" set released '2006' >/dev/null 2>&1
kg node "$VforVendetta" set tagline 'Freedom! Forever!' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 118 'Person' 'Natalie Portman'
NatalieP=$(kg node new --with-labels Person)
kg node "$NatalieP" set name 'Natalie Portman' >/dev/null 2>&1
kg node "$NatalieP" set born '1981' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 119 'Person' 'Stephen Rea'
StephenR=$(kg node new --with-labels Person)
kg node "$StephenR" set name 'Stephen Rea' >/dev/null 2>&1
kg node "$StephenR" set born '1946' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 120 'Person' 'John Hurt'
JohnH=$(kg node new --with-labels Person)
kg node "$JohnH" set name 'John Hurt' >/dev/null 2>&1
kg node "$JohnH" set born '1940' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 121 'Person' 'Ben Miles'
BenM=$(kg node new --with-labels Person)
kg node "$BenM" set name 'Ben Miles' >/dev/null 2>&1
kg node "$BenM" set born '1967' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 152 'ACTED_IN' 'Hugo Weaving' 'V for Vendetta'
l=$(kg node "$Hugo" link --as ACTED_IN --with-nodes "$VforVendetta" --with-properties 'roles=V')
printf '[%3d/253] %-10s %s -> %s\n' 153 'ACTED_IN' 'Natalie Portman' 'V for Vendetta'
l=$(kg node "$NatalieP" link --as ACTED_IN --with-nodes "$VforVendetta" --with-properties 'roles=Evey Hammond')
printf '[%3d/253] %-10s %s -> %s\n' 154 'ACTED_IN' 'Stephen Rea' 'V for Vendetta'
l=$(kg node "$StephenR" link --as ACTED_IN --with-nodes "$VforVendetta" --with-properties 'roles=Eric Finch')
printf '[%3d/253] %-10s %s -> %s\n' 155 'ACTED_IN' 'John Hurt' 'V for Vendetta'
l=$(kg node "$JohnH" link --as ACTED_IN --with-nodes "$VforVendetta" --with-properties 'roles=High Chancellor Adam Sutler')
printf '[%3d/253] %-10s %s -> %s\n' 156 'ACTED_IN' 'Ben Miles' 'V for Vendetta'
l=$(kg node "$BenM" link --as ACTED_IN --with-nodes "$VforVendetta" --with-properties 'roles=Dascomb')
printf '[%3d/253] %-10s %s -> %s\n' 157 'DIRECTED' 'James Marshall' 'V for Vendetta'
l=$(kg node "$JamesM" link --as DIRECTED --with-nodes "$VforVendetta")
printf '[%3d/253] %-10s %s -> %s\n' 158 'PRODUCED' 'Lilly Wachowski' 'V for Vendetta'
l=$(kg node "$LillyW" link --as PRODUCED --with-nodes "$VforVendetta")
printf '[%3d/253] %-10s %s -> %s\n' 159 'PRODUCED' 'Lana Wachowski' 'V for Vendetta'
l=$(kg node "$LanaW" link --as PRODUCED --with-nodes "$VforVendetta")
printf '[%3d/253] %-10s %s -> %s\n' 160 'PRODUCED' 'Joel Silver' 'V for Vendetta'
l=$(kg node "$JoelS" link --as PRODUCED --with-nodes "$VforVendetta")
printf '[%3d/253] %-10s %s -> %s\n' 161 'WROTE' 'Lilly Wachowski' 'V for Vendetta'
l=$(kg node "$LillyW" link --as WROTE --with-nodes "$VforVendetta")
printf '[%3d/253] %-10s %s -> %s\n' 162 'WROTE' 'Lana Wachowski' 'V for Vendetta'
l=$(kg node "$LanaW" link --as WROTE --with-nodes "$VforVendetta")
printf '[%3d/171] %-6s %s\n' 122 'Movie' 'Speed Racer'
SpeedRacer=$(kg node new --with-labels Movie)
kg node "$SpeedRacer" set title 'Speed Racer' >/dev/null 2>&1
kg node "$SpeedRacer" set released '2008' >/dev/null 2>&1
kg node "$SpeedRacer" set tagline 'Speed has no limits' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 123 'Person' 'Emile Hirsch'
EmileH=$(kg node new --with-labels Person)
kg node "$EmileH" set name 'Emile Hirsch' >/dev/null 2>&1
kg node "$EmileH" set born '1985' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 124 'Person' 'John Goodman'
JohnG=$(kg node new --with-labels Person)
kg node "$JohnG" set name 'John Goodman' >/dev/null 2>&1
kg node "$JohnG" set born '1960' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 125 'Person' 'Susan Sarandon'
SusanS=$(kg node new --with-labels Person)
kg node "$SusanS" set name 'Susan Sarandon' >/dev/null 2>&1
kg node "$SusanS" set born '1946' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 126 'Person' 'Matthew Fox'
MatthewF=$(kg node new --with-labels Person)
kg node "$MatthewF" set name 'Matthew Fox' >/dev/null 2>&1
kg node "$MatthewF" set born '1966' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 127 'Person' 'Christina Ricci'
ChristinaR=$(kg node new --with-labels Person)
kg node "$ChristinaR" set name 'Christina Ricci' >/dev/null 2>&1
kg node "$ChristinaR" set born '1980' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 128 'Person' 'Rain'
Rain=$(kg node new --with-labels Person)
kg node "$Rain" set name 'Rain' >/dev/null 2>&1
kg node "$Rain" set born '1982' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 163 'ACTED_IN' 'Emile Hirsch' 'Speed Racer'
l=$(kg node "$EmileH" link --as ACTED_IN --with-nodes "$SpeedRacer" --with-properties 'roles=Speed Racer')
printf '[%3d/253] %-10s %s -> %s\n' 164 'ACTED_IN' 'John Goodman' 'Speed Racer'
l=$(kg node "$JohnG" link --as ACTED_IN --with-nodes "$SpeedRacer" --with-properties 'roles=Pops')
printf '[%3d/253] %-10s %s -> %s\n' 165 'ACTED_IN' 'Susan Sarandon' 'Speed Racer'
l=$(kg node "$SusanS" link --as ACTED_IN --with-nodes "$SpeedRacer" --with-properties 'roles=Mom')
printf '[%3d/253] %-10s %s -> %s\n' 166 'ACTED_IN' 'Matthew Fox' 'Speed Racer'
l=$(kg node "$MatthewF" link --as ACTED_IN --with-nodes "$SpeedRacer" --with-properties 'roles=Racer X')
printf '[%3d/253] %-10s %s -> %s\n' 167 'ACTED_IN' 'Christina Ricci' 'Speed Racer'
l=$(kg node "$ChristinaR" link --as ACTED_IN --with-nodes "$SpeedRacer" --with-properties 'roles=Trixie')
printf '[%3d/253] %-10s %s -> %s\n' 168 'ACTED_IN' 'Rain' 'Speed Racer'
l=$(kg node "$Rain" link --as ACTED_IN --with-nodes "$SpeedRacer" --with-properties 'roles=Taejo Togokahn')
printf '[%3d/253] %-10s %s -> %s\n' 169 'ACTED_IN' 'Ben Miles' 'Speed Racer'
l=$(kg node "$BenM" link --as ACTED_IN --with-nodes "$SpeedRacer" --with-properties 'roles=Cass Jones')
printf '[%3d/253] %-10s %s -> %s\n' 170 'DIRECTED' 'Lilly Wachowski' 'Speed Racer'
l=$(kg node "$LillyW" link --as DIRECTED --with-nodes "$SpeedRacer")
printf '[%3d/253] %-10s %s -> %s\n' 171 'DIRECTED' 'Lana Wachowski' 'Speed Racer'
l=$(kg node "$LanaW" link --as DIRECTED --with-nodes "$SpeedRacer")
printf '[%3d/253] %-10s %s -> %s\n' 172 'WROTE' 'Lilly Wachowski' 'Speed Racer'
l=$(kg node "$LillyW" link --as WROTE --with-nodes "$SpeedRacer")
printf '[%3d/253] %-10s %s -> %s\n' 173 'WROTE' 'Lana Wachowski' 'Speed Racer'
l=$(kg node "$LanaW" link --as WROTE --with-nodes "$SpeedRacer")
printf '[%3d/253] %-10s %s -> %s\n' 174 'PRODUCED' 'Joel Silver' 'Speed Racer'
l=$(kg node "$JoelS" link --as PRODUCED --with-nodes "$SpeedRacer")
printf '[%3d/171] %-6s %s\n' 129 'Movie' 'Ninja Assassin'
NinjaAssassin=$(kg node new --with-labels Movie)
kg node "$NinjaAssassin" set title 'Ninja Assassin' >/dev/null 2>&1
kg node "$NinjaAssassin" set released '2009' >/dev/null 2>&1
kg node "$NinjaAssassin" set tagline 'Prepare to enter a secret world of assassins' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 130 'Person' 'Naomie Harris'
NaomieH=$(kg node new --with-labels Person)
kg node "$NaomieH" set name 'Naomie Harris' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 175 'ACTED_IN' 'Rain' 'Ninja Assassin'
l=$(kg node "$Rain" link --as ACTED_IN --with-nodes "$NinjaAssassin" --with-properties 'roles=Raizo')
printf '[%3d/253] %-10s %s -> %s\n' 176 'ACTED_IN' 'Naomie Harris' 'Ninja Assassin'
l=$(kg node "$NaomieH" link --as ACTED_IN --with-nodes "$NinjaAssassin" --with-properties 'roles=Mika Coretti')
printf '[%3d/253] %-10s %s -> %s\n' 177 'ACTED_IN' 'Rick Yune' 'Ninja Assassin'
l=$(kg node "$RickY" link --as ACTED_IN --with-nodes "$NinjaAssassin" --with-properties 'roles=Takeshi')
printf '[%3d/253] %-10s %s -> %s\n' 178 'ACTED_IN' 'Ben Miles' 'Ninja Assassin'
l=$(kg node "$BenM" link --as ACTED_IN --with-nodes "$NinjaAssassin" --with-properties 'roles=Ryan Maslow')
printf '[%3d/253] %-10s %s -> %s\n' 179 'DIRECTED' 'James Marshall' 'Ninja Assassin'
l=$(kg node "$JamesM" link --as DIRECTED --with-nodes "$NinjaAssassin")
printf '[%3d/253] %-10s %s -> %s\n' 180 'PRODUCED' 'Lilly Wachowski' 'Ninja Assassin'
l=$(kg node "$LillyW" link --as PRODUCED --with-nodes "$NinjaAssassin")
printf '[%3d/253] %-10s %s -> %s\n' 181 'PRODUCED' 'Lana Wachowski' 'Ninja Assassin'
l=$(kg node "$LanaW" link --as PRODUCED --with-nodes "$NinjaAssassin")
printf '[%3d/253] %-10s %s -> %s\n' 182 'PRODUCED' 'Joel Silver' 'Ninja Assassin'
l=$(kg node "$JoelS" link --as PRODUCED --with-nodes "$NinjaAssassin")
printf '[%3d/171] %-6s %s\n' 131 'Movie' 'The Green Mile'
TheGreenMile=$(kg node new --with-labels Movie)
kg node "$TheGreenMile" set title 'The Green Mile' >/dev/null 2>&1
kg node "$TheGreenMile" set released '1999' >/dev/null 2>&1
kg node "$TheGreenMile" set tagline 'Walk a mile you'\''ll never ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 132 'Person' 'Michael Clarke Duncan'
MichaelD=$(kg node new --with-labels Person)
kg node "$MichaelD" set name 'Michael Clarke Duncan' >/dev/null 2>&1
kg node "$MichaelD" set born '1957' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 133 'Person' 'David Morse'
DavidM=$(kg node new --with-labels Person)
kg node "$DavidM" set name 'David Morse' >/dev/null 2>&1
kg node "$DavidM" set born '1953' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 134 'Person' 'Sam Rockwell'
SamR=$(kg node new --with-labels Person)
kg node "$SamR" set name 'Sam Rockwell' >/dev/null 2>&1
kg node "$SamR" set born '1968' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 135 'Person' 'Gary Sinise'
GaryS=$(kg node new --with-labels Person)
kg node "$GaryS" set name 'Gary Sinise' >/dev/null 2>&1
kg node "$GaryS" set born '1955' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 136 'Person' 'Patricia Clarkson'
PatriciaC=$(kg node new --with-labels Person)
kg node "$PatriciaC" set name 'Patricia Clarkson' >/dev/null 2>&1
kg node "$PatriciaC" set born '1959' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 137 'Person' 'Frank Darabont'
FrankD=$(kg node new --with-labels Person)
kg node "$FrankD" set name 'Frank Darabont' >/dev/null 2>&1
kg node "$FrankD" set born '1959' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 183 'ACTED_IN' 'Tom Hanks' 'The Green Mile'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles=Paul Edgecomb')
printf '[%3d/253] %-10s %s -> %s\n' 184 'ACTED_IN' 'Michael Clarke Duncan' 'The Green Mile'
l=$(kg node "$MichaelD" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles=John Coffey')
printf '[%3d/253] %-10s %s -> %s\n' 185 'ACTED_IN' 'David Morse' 'The Green Mile'
l=$(kg node "$DavidM" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles=Brutus "Brutal" Howell')
printf '[%3d/253] %-10s %s -> %s\n' 186 'ACTED_IN' 'Bonnie Hunt' 'The Green Mile'
l=$(kg node "$BonnieH" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles=Jan Edgecomb')
printf '[%3d/253] %-10s %s -> %s\n' 187 'ACTED_IN' 'James Cromwell' 'The Green Mile'
l=$(kg node "$JamesC" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles=Warden Hal Moores')
printf '[%3d/253] %-10s %s -> %s\n' 188 'ACTED_IN' 'Sam Rockwell' 'The Green Mile'
l=$(kg node "$SamR" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles="Wild Bill" Wharton')
printf '[%3d/253] %-10s %s -> %s\n' 189 'ACTED_IN' 'Gary Sinise' 'The Green Mile'
l=$(kg node "$GaryS" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles=Burt Hammersmith')
printf '[%3d/253] %-10s %s -> %s\n' 190 'ACTED_IN' 'Patricia Clarkson' 'The Green Mile'
l=$(kg node "$PatriciaC" link --as ACTED_IN --with-nodes "$TheGreenMile" --with-properties 'roles=Melinda Moores')
printf '[%3d/253] %-10s %s -> %s\n' 191 'DIRECTED' 'Frank Darabont' 'The Green Mile'
l=$(kg node "$FrankD" link --as DIRECTED --with-nodes "$TheGreenMile")
printf '[%3d/171] %-6s %s\n' 138 'Movie' 'Frost/Nixon'
FrostNixon=$(kg node new --with-labels Movie)
kg node "$FrostNixon" set title 'Frost/Nixon' >/dev/null 2>&1
kg node "$FrostNixon" set released '2008' >/dev/null 2>&1
kg node "$FrostNixon" set tagline '400 million people were waiting for the ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 139 'Person' 'Frank Langella'
FrankL=$(kg node new --with-labels Person)
kg node "$FrankL" set name 'Frank Langella' >/dev/null 2>&1
kg node "$FrankL" set born '1938' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 140 'Person' 'Michael Sheen'
MichaelS=$(kg node new --with-labels Person)
kg node "$MichaelS" set name 'Michael Sheen' >/dev/null 2>&1
kg node "$MichaelS" set born '1969' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 141 'Person' 'Oliver Platt'
OliverP=$(kg node new --with-labels Person)
kg node "$OliverP" set name 'Oliver Platt' >/dev/null 2>&1
kg node "$OliverP" set born '1960' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 192 'ACTED_IN' 'Frank Langella' 'Frost/Nixon'
l=$(kg node "$FrankL" link --as ACTED_IN --with-nodes "$FrostNixon" --with-properties 'roles=Richard Nixon')
printf '[%3d/253] %-10s %s -> %s\n' 193 'ACTED_IN' 'Michael Sheen' 'Frost/Nixon'
l=$(kg node "$MichaelS" link --as ACTED_IN --with-nodes "$FrostNixon" --with-properties 'roles=David Frost')
printf '[%3d/253] %-10s %s -> %s\n' 194 'ACTED_IN' 'Kevin Bacon' 'Frost/Nixon'
l=$(kg node "$KevinB" link --as ACTED_IN --with-nodes "$FrostNixon" --with-properties 'roles=Jack Brennan')
printf '[%3d/253] %-10s %s -> %s\n' 195 'ACTED_IN' 'Oliver Platt' 'Frost/Nixon'
l=$(kg node "$OliverP" link --as ACTED_IN --with-nodes "$FrostNixon" --with-properties 'roles=Bob Zelnick')
printf '[%3d/253] %-10s %s -> %s\n' 196 'ACTED_IN' 'Sam Rockwell' 'Frost/Nixon'
l=$(kg node "$SamR" link --as ACTED_IN --with-nodes "$FrostNixon" --with-properties 'roles=James Reston, Jr.')
printf '[%3d/253] %-10s %s -> %s\n' 197 'DIRECTED' 'Ron Howard' 'Frost/Nixon'
l=$(kg node "$RonH" link --as DIRECTED --with-nodes "$FrostNixon")
printf '[%3d/171] %-6s %s\n' 142 'Movie' 'Hoffa'
Hoffa=$(kg node new --with-labels Movie)
kg node "$Hoffa" set title 'Hoffa' >/dev/null 2>&1
kg node "$Hoffa" set released '1992' >/dev/null 2>&1
kg node "$Hoffa" set tagline 'He didn'\''t want  He wanted ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 143 'Person' 'Danny DeVito'
DannyD=$(kg node new --with-labels Person)
kg node "$DannyD" set name 'Danny DeVito' >/dev/null 2>&1
kg node "$DannyD" set born '1944' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 144 'Person' 'John C. Reilly'
JohnR=$(kg node new --with-labels Person)
kg node "$JohnR" set name 'John C. Reilly' >/dev/null 2>&1
kg node "$JohnR" set born '1965' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 198 'ACTED_IN' 'Jack Nicholson' 'Hoffa'
l=$(kg node "$JackN" link --as ACTED_IN --with-nodes "$Hoffa" --with-properties 'roles=Hoffa')
printf '[%3d/253] %-10s %s -> %s\n' 199 'ACTED_IN' 'Danny DeVito' 'Hoffa'
l=$(kg node "$DannyD" link --as ACTED_IN --with-nodes "$Hoffa" --with-properties 'roles=Robert "Bobby" Ciaro')
printf '[%3d/253] %-10s %s -> %s\n' 200 'ACTED_IN' 'J.T. Walsh' 'Hoffa'
l=$(kg node "$JTW" link --as ACTED_IN --with-nodes "$Hoffa" --with-properties 'roles=Frank Fitzsimmons')
printf '[%3d/253] %-10s %s -> %s\n' 201 'ACTED_IN' 'John C. Reilly' 'Hoffa'
l=$(kg node "$JohnR" link --as ACTED_IN --with-nodes "$Hoffa" --with-properties 'roles=Peter "Pete" Connelly')
printf '[%3d/253] %-10s %s -> %s\n' 202 'DIRECTED' 'Danny DeVito' 'Hoffa'
l=$(kg node "$DannyD" link --as DIRECTED --with-nodes "$Hoffa")
printf '[%3d/171] %-6s %s\n' 145 'Movie' 'Apollo 13'
Apollo13=$(kg node new --with-labels Movie)
kg node "$Apollo13" set title 'Apollo 13' >/dev/null 2>&1
kg node "$Apollo13" set released '1995' >/dev/null 2>&1
kg node "$Apollo13" set tagline 'Houston, we have a ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 146 'Person' 'Ed Harris'
EdH=$(kg node new --with-labels Person)
kg node "$EdH" set name 'Ed Harris' >/dev/null 2>&1
kg node "$EdH" set born '1950' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 147 'Person' 'Bill Paxton'
BillPax=$(kg node new --with-labels Person)
kg node "$BillPax" set name 'Bill Paxton' >/dev/null 2>&1
kg node "$BillPax" set born '1955' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 203 'ACTED_IN' 'Tom Hanks' 'Apollo 13'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$Apollo13" --with-properties 'roles=Jim Lovell')
printf '[%3d/253] %-10s %s -> %s\n' 204 'ACTED_IN' 'Kevin Bacon' 'Apollo 13'
l=$(kg node "$KevinB" link --as ACTED_IN --with-nodes "$Apollo13" --with-properties 'roles=Jack Swigert')
printf '[%3d/253] %-10s %s -> %s\n' 205 'ACTED_IN' 'Ed Harris' 'Apollo 13'
l=$(kg node "$EdH" link --as ACTED_IN --with-nodes "$Apollo13" --with-properties 'roles=Gene Kranz')
printf '[%3d/253] %-10s %s -> %s\n' 206 'ACTED_IN' 'Bill Paxton' 'Apollo 13'
l=$(kg node "$BillPax" link --as ACTED_IN --with-nodes "$Apollo13" --with-properties 'roles=Fred Haise')
printf '[%3d/253] %-10s %s -> %s\n' 207 'ACTED_IN' 'Gary Sinise' 'Apollo 13'
l=$(kg node "$GaryS" link --as ACTED_IN --with-nodes "$Apollo13" --with-properties 'roles=Ken Mattingly')
printf '[%3d/253] %-10s %s -> %s\n' 208 'DIRECTED' 'Ron Howard' 'Apollo 13'
l=$(kg node "$RonH" link --as DIRECTED --with-nodes "$Apollo13")
printf '[%3d/171] %-6s %s\n' 148 'Movie' 'Twister'
Twister=$(kg node new --with-labels Movie)
kg node "$Twister" set title 'Twister' >/dev/null 2>&1
kg node "$Twister" set released '1996' >/dev/null 2>&1
kg node "$Twister" set tagline 'Don'\''t  Don'\''t Look ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 149 'Person' 'Philip Seymour Hoffman'
PhilipH=$(kg node new --with-labels Person)
kg node "$PhilipH" set name 'Philip Seymour Hoffman' >/dev/null 2>&1
kg node "$PhilipH" set born '1967' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 150 'Person' 'Jan de Bont'
JanB=$(kg node new --with-labels Person)
kg node "$JanB" set name 'Jan de Bont' >/dev/null 2>&1
kg node "$JanB" set born '1943' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 209 'ACTED_IN' 'Bill Paxton' 'Twister'
l=$(kg node "$BillPax" link --as ACTED_IN --with-nodes "$Twister" --with-properties 'roles=Bill Harding')
printf '[%3d/253] %-10s %s -> %s\n' 210 'ACTED_IN' 'Helen Hunt' 'Twister'
l=$(kg node "$HelenH" link --as ACTED_IN --with-nodes "$Twister" --with-properties 'roles=Dr. Jo Harding')
printf '[%3d/253] %-10s %s -> %s\n' 211 'ACTED_IN' 'Zach Grenier' 'Twister'
l=$(kg node "$ZachG" link --as ACTED_IN --with-nodes "$Twister" --with-properties 'roles=Eddie')
printf '[%3d/253] %-10s %s -> %s\n' 212 'ACTED_IN' 'Philip Seymour Hoffman' 'Twister'
l=$(kg node "$PhilipH" link --as ACTED_IN --with-nodes "$Twister" --with-properties 'roles=Dustin "Dusty" Davis')
printf '[%3d/253] %-10s %s -> %s\n' 213 'DIRECTED' 'Jan de Bont' 'Twister'
l=$(kg node "$JanB" link --as DIRECTED --with-nodes "$Twister")
printf '[%3d/171] %-6s %s\n' 151 'Movie' 'Cast Away'
CastAway=$(kg node new --with-labels Movie)
kg node "$CastAway" set title 'Cast Away' >/dev/null 2>&1
kg node "$CastAway" set released '2000' >/dev/null 2>&1
kg node "$CastAway" set tagline 'At the edge of the world, his journey ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 152 'Person' 'Robert Zemeckis'
RobertZ=$(kg node new --with-labels Person)
kg node "$RobertZ" set name 'Robert Zemeckis' >/dev/null 2>&1
kg node "$RobertZ" set born '1951' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 214 'ACTED_IN' 'Tom Hanks' 'Cast Away'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$CastAway" --with-properties 'roles=Chuck Noland')
printf '[%3d/253] %-10s %s -> %s\n' 215 'ACTED_IN' 'Helen Hunt' 'Cast Away'
l=$(kg node "$HelenH" link --as ACTED_IN --with-nodes "$CastAway" --with-properties 'roles=Kelly Frears')
printf '[%3d/253] %-10s %s -> %s\n' 216 'DIRECTED' 'Robert Zemeckis' 'Cast Away'
l=$(kg node "$RobertZ" link --as DIRECTED --with-nodes "$CastAway")
printf '[%3d/171] %-6s %s\n' 153 'Movie' 'One Flew Over the Cuckoo'\''s Nest'
OneFlewOvertheCuckoosNest=$(kg node new --with-labels Movie)
kg node "$OneFlewOvertheCuckoosNest" set title 'One Flew Over the Cuckoo'\''s Nest' >/dev/null 2>&1
kg node "$OneFlewOvertheCuckoosNest" set released '1975' >/dev/null 2>&1
kg node "$OneFlewOvertheCuckoosNest" set tagline 'If he'\''s crazy, what does that make you?' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 154 'Person' 'Milos Forman'
MilosF=$(kg node new --with-labels Person)
kg node "$MilosF" set name 'Milos Forman' >/dev/null 2>&1
kg node "$MilosF" set born '1932' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 217 'ACTED_IN' 'Jack Nicholson' 'One Flew Over the Cuckoo'\''s Nest'
l=$(kg node "$JackN" link --as ACTED_IN --with-nodes "$OneFlewOvertheCuckoosNest" --with-properties 'roles=Randle McMurphy')
printf '[%3d/253] %-10s %s -> %s\n' 218 'ACTED_IN' 'Danny DeVito' 'One Flew Over the Cuckoo'\''s Nest'
l=$(kg node "$DannyD" link --as ACTED_IN --with-nodes "$OneFlewOvertheCuckoosNest" --with-properties 'roles=Martini')
printf '[%3d/253] %-10s %s -> %s\n' 219 'DIRECTED' 'Milos Forman' 'One Flew Over the Cuckoo'\''s Nest'
l=$(kg node "$MilosF" link --as DIRECTED --with-nodes "$OneFlewOvertheCuckoosNest")
printf '[%3d/171] %-6s %s\n' 155 'Movie' 'Something'\''s Gotta Give'
SomethingsGottaGive=$(kg node new --with-labels Movie)
kg node "$SomethingsGottaGive" set title 'Something'\''s Gotta Give' >/dev/null 2>&1
kg node "$SomethingsGottaGive" set released '2003' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 156 'Person' 'Diane Keaton'
DianeK=$(kg node new --with-labels Person)
kg node "$DianeK" set name 'Diane Keaton' >/dev/null 2>&1
kg node "$DianeK" set born '1946' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 157 'Person' 'Nancy Meyers'
NancyM=$(kg node new --with-labels Person)
kg node "$NancyM" set name 'Nancy Meyers' >/dev/null 2>&1
kg node "$NancyM" set born '1949' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 220 'ACTED_IN' 'Jack Nicholson' 'Something'\''s Gotta Give'
l=$(kg node "$JackN" link --as ACTED_IN --with-nodes "$SomethingsGottaGive" --with-properties 'roles=Harry Sanborn')
printf '[%3d/253] %-10s %s -> %s\n' 221 'ACTED_IN' 'Diane Keaton' 'Something'\''s Gotta Give'
l=$(kg node "$DianeK" link --as ACTED_IN --with-nodes "$SomethingsGottaGive" --with-properties 'roles=Erica Barry')
printf '[%3d/253] %-10s %s -> %s\n' 222 'ACTED_IN' 'Keanu Reeves' 'Something'\''s Gotta Give'
l=$(kg node "$Keanu" link --as ACTED_IN --with-nodes "$SomethingsGottaGive" --with-properties 'roles=Julian Mercer')
printf '[%3d/253] %-10s %s -> %s\n' 223 'DIRECTED' 'Nancy Meyers' 'Something'\''s Gotta Give'
l=$(kg node "$NancyM" link --as DIRECTED --with-nodes "$SomethingsGottaGive")
printf '[%3d/253] %-10s %s -> %s\n' 224 'PRODUCED' 'Nancy Meyers' 'Something'\''s Gotta Give'
l=$(kg node "$NancyM" link --as PRODUCED --with-nodes "$SomethingsGottaGive")
printf '[%3d/253] %-10s %s -> %s\n' 225 'WROTE' 'Nancy Meyers' 'Something'\''s Gotta Give'
l=$(kg node "$NancyM" link --as WROTE --with-nodes "$SomethingsGottaGive")
printf '[%3d/171] %-6s %s\n' 158 'Movie' 'Bicentennial Man'
BicentennialMan=$(kg node new --with-labels Movie)
kg node "$BicentennialMan" set title 'Bicentennial Man' >/dev/null 2>&1
kg node "$BicentennialMan" set released '1999' >/dev/null 2>&1
kg node "$BicentennialMan" set tagline 'One robot'\''s 200 year journey to become an ordinary ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 159 'Person' 'Chris Columbus'
ChrisC=$(kg node new --with-labels Person)
kg node "$ChrisC" set name 'Chris Columbus' >/dev/null 2>&1
kg node "$ChrisC" set born '1958' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 226 'ACTED_IN' 'Robin Williams' 'Bicentennial Man'
l=$(kg node "$Robin" link --as ACTED_IN --with-nodes "$BicentennialMan" --with-properties 'roles=Andrew Marin')
printf '[%3d/253] %-10s %s -> %s\n' 227 'ACTED_IN' 'Oliver Platt' 'Bicentennial Man'
l=$(kg node "$OliverP" link --as ACTED_IN --with-nodes "$BicentennialMan" --with-properties 'roles=Rupert Burns')
printf '[%3d/253] %-10s %s -> %s\n' 228 'DIRECTED' 'Chris Columbus' 'Bicentennial Man'
l=$(kg node "$ChrisC" link --as DIRECTED --with-nodes "$BicentennialMan")
printf '[%3d/171] %-6s %s\n' 160 'Movie' 'Charlie Wilson'\''s War'
CharlieWilsonsWar=$(kg node new --with-labels Movie)
kg node "$CharlieWilsonsWar" set title 'Charlie Wilson'\''s War' >/dev/null 2>&1
kg node "$CharlieWilsonsWar" set released '2007' >/dev/null 2>&1
kg node "$CharlieWilsonsWar" set tagline 'A stiff  A little  A lot of  Who said they couldn'\''t bring down the Soviet ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 161 'Person' 'Julia Roberts'
JuliaR=$(kg node new --with-labels Person)
kg node "$JuliaR" set name 'Julia Roberts' >/dev/null 2>&1
kg node "$JuliaR" set born '1967' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 229 'ACTED_IN' 'Tom Hanks' 'Charlie Wilson'\''s War'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$CharlieWilsonsWar" --with-properties 'roles=Rep. Charlie Wilson')
printf '[%3d/253] %-10s %s -> %s\n' 230 'ACTED_IN' 'Julia Roberts' 'Charlie Wilson'\''s War'
l=$(kg node "$JuliaR" link --as ACTED_IN --with-nodes "$CharlieWilsonsWar" --with-properties 'roles=Joanne Herring')
printf '[%3d/253] %-10s %s -> %s\n' 231 'ACTED_IN' 'Philip Seymour Hoffman' 'Charlie Wilson'\''s War'
l=$(kg node "$PhilipH" link --as ACTED_IN --with-nodes "$CharlieWilsonsWar" --with-properties 'roles=Gust Avrakotos')
printf '[%3d/253] %-10s %s -> %s\n' 232 'DIRECTED' 'Mike Nichols' 'Charlie Wilson'\''s War'
l=$(kg node "$MikeN" link --as DIRECTED --with-nodes "$CharlieWilsonsWar")
printf '[%3d/171] %-6s %s\n' 162 'Movie' 'The Polar Express'
ThePolarExpress=$(kg node new --with-labels Movie)
kg node "$ThePolarExpress" set title 'The Polar Express' >/dev/null 2>&1
kg node "$ThePolarExpress" set released '2004' >/dev/null 2>&1
kg node "$ThePolarExpress" set tagline 'This Holiday .. Believe' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 233 'ACTED_IN' 'Tom Hanks' 'The Polar Express'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$ThePolarExpress")
kg link "$l" add roles 'Hero Boy' 'Father' 'Conductor' 'Hobo' 'Scrooge' 'Santa Claus' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 234 'DIRECTED' 'Robert Zemeckis' 'The Polar Express'
l=$(kg node "$RobertZ" link --as DIRECTED --with-nodes "$ThePolarExpress")
printf '[%3d/171] %-6s %s\n' 163 'Movie' 'A League of Their Own'
ALeagueofTheirOwn=$(kg node new --with-labels Movie)
kg node "$ALeagueofTheirOwn" set title 'A League of Their Own' >/dev/null 2>&1
kg node "$ALeagueofTheirOwn" set released '1992' >/dev/null 2>&1
kg node "$ALeagueofTheirOwn" set tagline 'Once in a lifetime you get a chance to do something ' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 164 'Person' 'Madonna'
Madonna=$(kg node new --with-labels Person)
kg node "$Madonna" set name 'Madonna' >/dev/null 2>&1
kg node "$Madonna" set born '1954' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 165 'Person' 'Geena Davis'
GeenaD=$(kg node new --with-labels Person)
kg node "$GeenaD" set name 'Geena Davis' >/dev/null 2>&1
kg node "$GeenaD" set born '1956' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 166 'Person' 'Lori Petty'
LoriP=$(kg node new --with-labels Person)
kg node "$LoriP" set name 'Lori Petty' >/dev/null 2>&1
kg node "$LoriP" set born '1963' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 167 'Person' 'Penny Marshall'
PennyM=$(kg node new --with-labels Person)
kg node "$PennyM" set name 'Penny Marshall' >/dev/null 2>&1
kg node "$PennyM" set born '1943' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 235 'ACTED_IN' 'Tom Hanks' 'A League of Their Own'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Jimmy Dugan')
printf '[%3d/253] %-10s %s -> %s\n' 236 'ACTED_IN' 'Geena Davis' 'A League of Their Own'
l=$(kg node "$GeenaD" link --as ACTED_IN --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Dottie Hinson')
printf '[%3d/253] %-10s %s -> %s\n' 237 'ACTED_IN' 'Lori Petty' 'A League of Their Own'
l=$(kg node "$LoriP" link --as ACTED_IN --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Kit Keller')
printf '[%3d/253] %-10s %s -> %s\n' 238 'ACTED_IN' 'Rosie O'\''Donnell' 'A League of Their Own'
l=$(kg node "$RosieO" link --as ACTED_IN --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Doris Murphy')
printf '[%3d/253] %-10s %s -> %s\n' 239 'ACTED_IN' 'Madonna' 'A League of Their Own'
l=$(kg node "$Madonna" link --as ACTED_IN --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles="All the Way" Mae Mordabito')
printf '[%3d/253] %-10s %s -> %s\n' 240 'ACTED_IN' 'Bill Paxton' 'A League of Their Own'
l=$(kg node "$BillPax" link --as ACTED_IN --with-nodes "$ALeagueofTheirOwn" --with-properties 'roles=Bob Hinson')
printf '[%3d/253] %-10s %s -> %s\n' 241 'DIRECTED' 'Penny Marshall' 'A League of Their Own'
l=$(kg node "$PennyM" link --as DIRECTED --with-nodes "$ALeagueofTheirOwn")
printf '[%3d/171] %-6s %s\n' 168 'Person' 'Paul Blythe'
PaulBlythe=$(kg node new --with-labels Person)
kg node "$PaulBlythe" set name 'Paul Blythe' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 169 'Person' 'Angela Scope'
AngelaScope=$(kg node new --with-labels Person)
kg node "$AngelaScope" set name 'Angela Scope' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 170 'Person' 'Jessica Thompson'
JessicaThompson=$(kg node new --with-labels Person)
kg node "$JessicaThompson" set name 'Jessica Thompson' >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 171 'Person' 'James Thompson'
JamesThompson=$(kg node new --with-labels Person)
kg node "$JamesThompson" set name 'James Thompson' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 242 'FOLLOWS' 'James Thompson' 'Jessica Thompson'
l=$(kg node "$JamesThompson" link --as FOLLOWS --with-nodes "$JessicaThompson")
printf '[%3d/253] %-10s %s -> %s\n' 243 'FOLLOWS' 'Angela Scope' 'Jessica Thompson'
l=$(kg node "$AngelaScope" link --as FOLLOWS --with-nodes "$JessicaThompson")
printf '[%3d/253] %-10s %s -> %s\n' 244 'FOLLOWS' 'Paul Blythe' 'Angela Scope'
l=$(kg node "$PaulBlythe" link --as FOLLOWS --with-nodes "$AngelaScope")
printf '[%3d/253] %-10s %s -> %s\n' 245 'REVIEWED' 'Jessica Thompson' 'Cloud Atlas'
l=$(kg node "$JessicaThompson" link --as REVIEWED --with-nodes "$CloudAtlas" --with-properties 'summary=An amazing journey' 'rating=95')
printf '[%3d/253] %-10s %s -> %s\n' 246 'REVIEWED' 'Jessica Thompson' 'The Replacements'
l=$(kg node "$JessicaThompson" link --as REVIEWED --with-nodes "$TheReplacements" --with-properties 'summary=Silly, but fun' 'rating=65')
printf '[%3d/253] %-10s %s -> %s\n' 247 'REVIEWED' 'James Thompson' 'The Replacements'
l=$(kg node "$JamesThompson" link --as REVIEWED --with-nodes "$TheReplacements" --with-properties 'summary=The coolest football movie ever' 'rating=100')
printf '[%3d/253] %-10s %s -> %s\n' 248 'REVIEWED' 'Angela Scope' 'The Replacements'
l=$(kg node "$AngelaScope" link --as REVIEWED --with-nodes "$TheReplacements" --with-properties 'summary=Pretty funny at times' 'rating=62')
printf '[%3d/253] %-10s %s -> %s\n' 249 'REVIEWED' 'Jessica Thompson' 'Unforgiven'
l=$(kg node "$JessicaThompson" link --as REVIEWED --with-nodes "$Unforgiven" --with-properties 'summary=Dark, but compelling' 'rating=85')
printf '[%3d/253] %-10s %s -> %s\n' 250 'REVIEWED' 'Jessica Thompson' 'The Birdcage'
l=$(kg node "$JessicaThompson" link --as REVIEWED --with-nodes "$TheBirdcage" --with-properties 'summary=Slapstick redeemed only by the Robin Williams and Gene Hackman'\''s stellar performances' 'rating=45')
printf '[%3d/253] %-10s %s -> %s\n' 251 'REVIEWED' 'Jessica Thompson' 'The Da Vinci Code'
l=$(kg node "$JessicaThompson" link --as REVIEWED --with-nodes "$TheDaVinciCode" --with-properties 'summary=A solid romp' 'rating=68')
printf '[%3d/253] %-10s %s -> %s\n' 252 'REVIEWED' 'James Thompson' 'The Da Vinci Code'
l=$(kg node "$JamesThompson" link --as REVIEWED --with-nodes "$TheDaVinciCode" --with-properties 'summary=Fun, but a little far fetched' 'rating=65')
printf '[%3d/253] %-10s %s -> %s\n' 253 'REVIEWED' 'Jessica Thompson' 'Jerry Maguire'
l=$(kg node "$JessicaThompson" link --as REVIEWED --with-nodes "$JerryMaguire" --with-properties 'summary=You had me at Jerry' 'rating=92')

printf '\n%s nodes, %s relations\n' 171 253
