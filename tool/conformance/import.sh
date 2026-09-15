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
printf %s '{"title":"The Matrix","released":"1999","tagline":"Welcome to the Real World"}' | kg node "$TheMatrix" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 2 'Person' 'Keanu Reeves'
Keanu=$(kg node new --with-labels Person)
printf %s '{"name":"Keanu Reeves","born":"1964"}' | kg node "$Keanu" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 3 'Person' 'Carrie-Anne Moss'
Carrie=$(kg node new --with-labels Person)
printf %s '{"name":"Carrie-Anne Moss","born":"1967"}' | kg node "$Carrie" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 4 'Person' 'Laurence Fishburne'
Laurence=$(kg node new --with-labels Person)
printf %s '{"name":"Laurence Fishburne","born":"1961"}' | kg node "$Laurence" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 5 'Person' 'Hugo Weaving'
Hugo=$(kg node new --with-labels Person)
printf %s '{"name":"Hugo Weaving","born":"1960"}' | kg node "$Hugo" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 6 'Person' 'Lilly Wachowski'
LillyW=$(kg node new --with-labels Person)
printf %s '{"name":"Lilly Wachowski","born":"1967"}' | kg node "$LillyW" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 7 'Person' 'Lana Wachowski'
LanaW=$(kg node new --with-labels Person)
printf %s '{"name":"Lana Wachowski","born":"1965"}' | kg node "$LanaW" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 8 'Person' 'Joel Silver'
JoelS=$(kg node new --with-labels Person)
printf %s '{"name":"Joel Silver","born":"1952"}' | kg node "$JoelS" set --stdin >/dev/null 2>&1
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
printf %s '{"name":"Emil Eifrem","born":"1978"}' | kg node "$Emil" set --stdin >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 8 'ACTED_IN' 'Emil Eifrem' 'The Matrix'
l=$(kg node "$Emil" link --as ACTED_IN --with-nodes "$TheMatrix")
printf '[%3d/171] %-6s %s\n' 10 'Movie' 'The Matrix Reloaded'
TheMatrixReloaded=$(kg node new --with-labels Movie)
printf %s '{"title":"The Matrix Reloaded","released":"2003","tagline":"Free your mind"}' | kg node "$TheMatrixReloaded" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"The Matrix Revolutions","released":"2003","tagline":"Everything that has a beginning has an end"}' | kg node "$TheMatrixRevolutions" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"The Devil'\''s Advocate","released":"1997","tagline":"Evil has its winning ways"}' | kg node "$TheDevilsAdvocate" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 13 'Person' 'Charlize Theron'
Charlize=$(kg node new --with-labels Person)
printf %s '{"name":"Charlize Theron","born":"1975"}' | kg node "$Charlize" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 14 'Person' 'Al Pacino'
Al=$(kg node new --with-labels Person)
printf %s '{"name":"Al Pacino","born":"1940"}' | kg node "$Al" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 15 'Person' 'Taylor Hackford'
Taylor=$(kg node new --with-labels Person)
printf %s '{"name":"Taylor Hackford","born":"1944"}' | kg node "$Taylor" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"A Few Good Men","released":"1992","tagline":"In the heart of the nation'\''s capital, in a courthouse of the  government, one man will stop at nothing to keep his honor, and one will stop at nothing to find the "}' | kg node "$AFewGoodMen" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 17 'Person' 'Tom Cruise'
TomC=$(kg node new --with-labels Person)
printf %s '{"name":"Tom Cruise","born":"1962"}' | kg node "$TomC" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 18 'Person' 'Jack Nicholson'
JackN=$(kg node new --with-labels Person)
printf %s '{"name":"Jack Nicholson","born":"1937"}' | kg node "$JackN" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 19 'Person' 'Demi Moore'
DemiM=$(kg node new --with-labels Person)
printf %s '{"name":"Demi Moore","born":"1962"}' | kg node "$DemiM" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 20 'Person' 'Kevin Bacon'
KevinB=$(kg node new --with-labels Person)
printf %s '{"name":"Kevin Bacon","born":"1958"}' | kg node "$KevinB" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 21 'Person' 'Kiefer Sutherland'
KieferS=$(kg node new --with-labels Person)
printf %s '{"name":"Kiefer Sutherland","born":"1966"}' | kg node "$KieferS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 22 'Person' 'Noah Wyle'
NoahW=$(kg node new --with-labels Person)
printf %s '{"name":"Noah Wyle","born":"1971"}' | kg node "$NoahW" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 23 'Person' 'Cuba Gooding Jr.'
CubaG=$(kg node new --with-labels Person)
printf %s '{"name":"Cuba Gooding Jr.","born":"1968"}' | kg node "$CubaG" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 24 'Person' 'Kevin Pollak'
KevinP=$(kg node new --with-labels Person)
printf %s '{"name":"Kevin Pollak","born":"1957"}' | kg node "$KevinP" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 25 'Person' 'J.T. Walsh'
JTW=$(kg node new --with-labels Person)
printf %s '{"name":"J.T. Walsh","born":"1943"}' | kg node "$JTW" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 26 'Person' 'James Marshall'
JamesM=$(kg node new --with-labels Person)
printf %s '{"name":"James Marshall","born":"1967"}' | kg node "$JamesM" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 27 'Person' 'Christopher Guest'
ChristopherG=$(kg node new --with-labels Person)
printf %s '{"name":"Christopher Guest","born":"1948"}' | kg node "$ChristopherG" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 28 'Person' 'Rob Reiner'
RobR=$(kg node new --with-labels Person)
printf %s '{"name":"Rob Reiner","born":"1947"}' | kg node "$RobR" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 29 'Person' 'Aaron Sorkin'
AaronS=$(kg node new --with-labels Person)
printf %s '{"name":"Aaron Sorkin","born":"1961"}' | kg node "$AaronS" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Top Gun","released":"1986","tagline":"I feel the need, the need for "}' | kg node "$TopGun" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 31 'Person' 'Kelly McGillis'
KellyM=$(kg node new --with-labels Person)
printf %s '{"name":"Kelly McGillis","born":"1957"}' | kg node "$KellyM" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 32 'Person' 'Val Kilmer'
ValK=$(kg node new --with-labels Person)
printf %s '{"name":"Val Kilmer","born":"1959"}' | kg node "$ValK" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 33 'Person' 'Anthony Edwards'
AnthonyE=$(kg node new --with-labels Person)
printf %s '{"name":"Anthony Edwards","born":"1962"}' | kg node "$AnthonyE" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 34 'Person' 'Tom Skerritt'
TomS=$(kg node new --with-labels Person)
printf %s '{"name":"Tom Skerritt","born":"1933"}' | kg node "$TomS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 35 'Person' 'Meg Ryan'
MegR=$(kg node new --with-labels Person)
printf %s '{"name":"Meg Ryan","born":"1961"}' | kg node "$MegR" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 36 'Person' 'Tony Scott'
TonyS=$(kg node new --with-labels Person)
printf %s '{"name":"Tony Scott","born":"1944"}' | kg node "$TonyS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 37 'Person' 'Jim Cash'
JimC=$(kg node new --with-labels Person)
printf %s '{"name":"Jim Cash","born":"1941"}' | kg node "$JimC" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Jerry Maguire","released":"2000","tagline":"The rest of his life begins "}' | kg node "$JerryMaguire" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 39 'Person' 'Renee Zellweger'
ReneeZ=$(kg node new --with-labels Person)
printf %s '{"name":"Renee Zellweger","born":"1969"}' | kg node "$ReneeZ" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 40 'Person' 'Kelly Preston'
KellyP=$(kg node new --with-labels Person)
printf %s '{"name":"Kelly Preston","born":"1962"}' | kg node "$KellyP" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 41 'Person' 'Jerry O'\''Connell'
JerryO=$(kg node new --with-labels Person)
printf %s '{"name":"Jerry O'\''Connell","born":"1974"}' | kg node "$JerryO" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 42 'Person' 'Jay Mohr'
JayM=$(kg node new --with-labels Person)
printf %s '{"name":"Jay Mohr","born":"1970"}' | kg node "$JayM" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 43 'Person' 'Bonnie Hunt'
BonnieH=$(kg node new --with-labels Person)
printf %s '{"name":"Bonnie Hunt","born":"1961"}' | kg node "$BonnieH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 44 'Person' 'Regina King'
ReginaK=$(kg node new --with-labels Person)
printf %s '{"name":"Regina King","born":"1971"}' | kg node "$ReginaK" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 45 'Person' 'Jonathan Lipnicki'
JonathanL=$(kg node new --with-labels Person)
printf %s '{"name":"Jonathan Lipnicki","born":"1996"}' | kg node "$JonathanL" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 46 'Person' 'Cameron Crowe'
CameronC=$(kg node new --with-labels Person)
printf %s '{"name":"Cameron Crowe","born":"1957"}' | kg node "$CameronC" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Stand By Me","released":"1986","tagline":"For some, it'\''s the last real taste of innocence, and the first real taste of  But for everyone, it'\''s the time that memories are made "}' | kg node "$StandByMe" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 48 'Person' 'River Phoenix'
RiverP=$(kg node new --with-labels Person)
printf %s '{"name":"River Phoenix","born":"1970"}' | kg node "$RiverP" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 49 'Person' 'Corey Feldman'
CoreyF=$(kg node new --with-labels Person)
printf %s '{"name":"Corey Feldman","born":"1971"}' | kg node "$CoreyF" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 50 'Person' 'Wil Wheaton'
WilW=$(kg node new --with-labels Person)
printf %s '{"name":"Wil Wheaton","born":"1972"}' | kg node "$WilW" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 51 'Person' 'John Cusack'
JohnC=$(kg node new --with-labels Person)
printf %s '{"name":"John Cusack","born":"1966"}' | kg node "$JohnC" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 52 'Person' 'Marshall Bell'
MarshallB=$(kg node new --with-labels Person)
printf %s '{"name":"Marshall Bell","born":"1942"}' | kg node "$MarshallB" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"As Good as It Gets","released":"1997","tagline":"A comedy from the heart that goes for the "}' | kg node "$AsGoodAsItGets" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 54 'Person' 'Helen Hunt'
HelenH=$(kg node new --with-labels Person)
printf %s '{"name":"Helen Hunt","born":"1963"}' | kg node "$HelenH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 55 'Person' 'Greg Kinnear'
GregK=$(kg node new --with-labels Person)
printf %s '{"name":"Greg Kinnear","born":"1963"}' | kg node "$GregK" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 56 'Person' 'James L. Brooks'
JamesB=$(kg node new --with-labels Person)
printf %s '{"name":"James L. Brooks","born":"1940"}' | kg node "$JamesB" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"What Dreams May Come","released":"1998","tagline":"After life there is  The end is just the "}' | kg node "$WhatDreamsMayCome" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 58 'Person' 'Annabella Sciorra'
AnnabellaS=$(kg node new --with-labels Person)
printf %s '{"name":"Annabella Sciorra","born":"1960"}' | kg node "$AnnabellaS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 59 'Person' 'Max von Sydow'
MaxS=$(kg node new --with-labels Person)
printf %s '{"name":"Max von Sydow","born":"1929"}' | kg node "$MaxS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 60 'Person' 'Werner Herzog'
WernerH=$(kg node new --with-labels Person)
printf %s '{"name":"Werner Herzog","born":"1942"}' | kg node "$WernerH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 61 'Person' 'Robin Williams'
Robin=$(kg node new --with-labels Person)
printf %s '{"name":"Robin Williams","born":"1951"}' | kg node "$Robin" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 62 'Person' 'Vincent Ward'
VincentW=$(kg node new --with-labels Person)
printf %s '{"name":"Vincent Ward","born":"1956"}' | kg node "$VincentW" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Snow Falling on Cedars","released":"1999","tagline":"First loves  "}' | kg node "$SnowFallingonCedars" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 64 'Person' 'Ethan Hawke'
EthanH=$(kg node new --with-labels Person)
printf %s '{"name":"Ethan Hawke","born":"1970"}' | kg node "$EthanH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 65 'Person' 'Rick Yune'
RickY=$(kg node new --with-labels Person)
printf %s '{"name":"Rick Yune","born":"1971"}' | kg node "$RickY" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 66 'Person' 'James Cromwell'
JamesC=$(kg node new --with-labels Person)
printf %s '{"name":"James Cromwell","born":"1940"}' | kg node "$JamesC" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 67 'Person' 'Scott Hicks'
ScottH=$(kg node new --with-labels Person)
printf %s '{"name":"Scott Hicks","born":"1953"}' | kg node "$ScottH" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"You'\''ve Got Mail","released":"1998","tagline":"At odds in .. in love on-"}' | kg node "$YouveGotMail" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 69 'Person' 'Tom Hanks'
TomH=$(kg node new --with-labels Person)
printf %s '{"name":"Tom Hanks","born":"1956"}' | kg node "$TomH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 70 'Person' 'Parker Posey'
ParkerP=$(kg node new --with-labels Person)
printf %s '{"name":"Parker Posey","born":"1968"}' | kg node "$ParkerP" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 71 'Person' 'Dave Chappelle'
DaveC=$(kg node new --with-labels Person)
printf %s '{"name":"Dave Chappelle","born":"1973"}' | kg node "$DaveC" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 72 'Person' 'Steve Zahn'
SteveZ=$(kg node new --with-labels Person)
printf %s '{"name":"Steve Zahn","born":"1967"}' | kg node "$SteveZ" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 73 'Person' 'Nora Ephron'
NoraE=$(kg node new --with-labels Person)
printf %s '{"name":"Nora Ephron","born":"1941"}' | kg node "$NoraE" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Sleepless in Seattle","released":"1993","tagline":"What if someone you never met, someone you never saw, someone you never knew was the only someone for you?"}' | kg node "$SleeplessInSeattle" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 75 'Person' 'Rita Wilson'
RitaW=$(kg node new --with-labels Person)
printf %s '{"name":"Rita Wilson","born":"1956"}' | kg node "$RitaW" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 76 'Person' 'Bill Pullman'
BillPull=$(kg node new --with-labels Person)
printf %s '{"name":"Bill Pullman","born":"1953"}' | kg node "$BillPull" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 77 'Person' 'Victor Garber'
VictorG=$(kg node new --with-labels Person)
printf %s '{"name":"Victor Garber","born":"1949"}' | kg node "$VictorG" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 78 'Person' 'Rosie O'\''Donnell'
RosieO=$(kg node new --with-labels Person)
printf %s '{"name":"Rosie O'\''Donnell","born":"1962"}' | kg node "$RosieO" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Joe Versus the Volcano","released":"1990","tagline":"A story of love, lava and burning "}' | kg node "$JoeVersustheVolcano" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 80 'Person' 'John Patrick Stanley'
JohnS=$(kg node new --with-labels Person)
printf %s '{"name":"John Patrick Stanley","born":"1950"}' | kg node "$JohnS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 81 'Person' 'Nathan Lane'
Nathan=$(kg node new --with-labels Person)
printf %s '{"name":"Nathan Lane","born":"1956"}' | kg node "$Nathan" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"When Harry Met Sally","released":"1998","tagline":"Can two friends sleep together and still love each other in the morning?"}' | kg node "$WhenHarryMetSally" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 83 'Person' 'Billy Crystal'
BillyC=$(kg node new --with-labels Person)
printf %s '{"name":"Billy Crystal","born":"1948"}' | kg node "$BillyC" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 84 'Person' 'Carrie Fisher'
CarrieF=$(kg node new --with-labels Person)
printf %s '{"name":"Carrie Fisher","born":"1956"}' | kg node "$CarrieF" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 85 'Person' 'Bruno Kirby'
BrunoK=$(kg node new --with-labels Person)
printf %s '{"name":"Bruno Kirby","born":"1949"}' | kg node "$BrunoK" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"That Thing You Do","released":"1996","tagline":"In every life there comes a time when that thing you dream becomes that thing you do"}' | kg node "$ThatThingYouDo" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 87 'Person' 'Liv Tyler'
LivT=$(kg node new --with-labels Person)
printf %s '{"name":"Liv Tyler","born":"1977"}' | kg node "$LivT" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"The Replacements","released":"2000","tagline":"Pain heals, Chicks dig .. Glory lasts forever"}' | kg node "$TheReplacements" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 89 'Person' 'Brooke Langton'
Brooke=$(kg node new --with-labels Person)
printf %s '{"name":"Brooke Langton","born":"1970"}' | kg node "$Brooke" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 90 'Person' 'Gene Hackman'
Gene=$(kg node new --with-labels Person)
printf %s '{"name":"Gene Hackman","born":"1930"}' | kg node "$Gene" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 91 'Person' 'Orlando Jones'
Orlando=$(kg node new --with-labels Person)
printf %s '{"name":"Orlando Jones","born":"1968"}' | kg node "$Orlando" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 92 'Person' 'Howard Deutch'
Howard=$(kg node new --with-labels Person)
printf %s '{"name":"Howard Deutch","born":"1950"}' | kg node "$Howard" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"RescueDawn","released":"2006","tagline":"Based on the extraordinary true story of one man'\''s fight for freedom"}' | kg node "$RescueDawn" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 94 'Person' 'Christian Bale'
ChristianB=$(kg node new --with-labels Person)
printf %s '{"name":"Christian Bale","born":"1974"}' | kg node "$ChristianB" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 95 'Person' 'Zach Grenier'
ZachG=$(kg node new --with-labels Person)
printf %s '{"name":"Zach Grenier","born":"1954"}' | kg node "$ZachG" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"The Birdcage","released":"1996","tagline":"Come as you are"}' | kg node "$TheBirdcage" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 97 'Person' 'Mike Nichols'
MikeN=$(kg node new --with-labels Person)
printf %s '{"name":"Mike Nichols","born":"1931"}' | kg node "$MikeN" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Unforgiven","released":"1992","tagline":"It'\''s a hell of a thing, killing a man"}' | kg node "$Unforgiven" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 99 'Person' 'Richard Harris'
RichardH=$(kg node new --with-labels Person)
printf %s '{"name":"Richard Harris","born":"1930"}' | kg node "$RichardH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 100 'Person' 'Clint Eastwood'
ClintE=$(kg node new --with-labels Person)
printf %s '{"name":"Clint Eastwood","born":"1930"}' | kg node "$ClintE" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Johnny Mnemonic","released":"1995","tagline":"The hottest data on  In the coolest head in town"}' | kg node "$JohnnyMnemonic" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 102 'Person' 'Takeshi Kitano'
Takeshi=$(kg node new --with-labels Person)
printf %s '{"name":"Takeshi Kitano","born":"1947"}' | kg node "$Takeshi" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 103 'Person' 'Dina Meyer'
Dina=$(kg node new --with-labels Person)
printf %s '{"name":"Dina Meyer","born":"1968"}' | kg node "$Dina" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 104 'Person' 'Ice-T'
IceT=$(kg node new --with-labels Person)
printf %s '{"name":"Ice-T","born":"1958"}' | kg node "$IceT" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 105 'Person' 'Robert Longo'
RobertL=$(kg node new --with-labels Person)
printf %s '{"name":"Robert Longo","born":"1953"}' | kg node "$RobertL" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Cloud Atlas","released":"2012","tagline":"Everything is connected"}' | kg node "$CloudAtlas" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 107 'Person' 'Halle Berry'
HalleB=$(kg node new --with-labels Person)
printf %s '{"name":"Halle Berry","born":"1966"}' | kg node "$HalleB" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 108 'Person' 'Jim Broadbent'
JimB=$(kg node new --with-labels Person)
printf %s '{"name":"Jim Broadbent","born":"1949"}' | kg node "$JimB" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 109 'Person' 'Tom Tykwer'
TomT=$(kg node new --with-labels Person)
printf %s '{"name":"Tom Tykwer","born":"1965"}' | kg node "$TomT" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 110 'Person' 'David Mitchell'
DavidMitchell=$(kg node new --with-labels Person)
printf %s '{"name":"David Mitchell","born":"1969"}' | kg node "$DavidMitchell" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 111 'Person' 'Stefan Arndt'
StefanArndt=$(kg node new --with-labels Person)
printf %s '{"name":"Stefan Arndt","born":"1961"}' | kg node "$StefanArndt" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"The Da Vinci Code","released":"2006","tagline":"Break The Codes"}' | kg node "$TheDaVinciCode" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 113 'Person' 'Ian McKellen'
IanM=$(kg node new --with-labels Person)
printf %s '{"name":"Ian McKellen","born":"1939"}' | kg node "$IanM" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 114 'Person' 'Audrey Tautou'
AudreyT=$(kg node new --with-labels Person)
printf %s '{"name":"Audrey Tautou","born":"1976"}' | kg node "$AudreyT" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 115 'Person' 'Paul Bettany'
PaulB=$(kg node new --with-labels Person)
printf %s '{"name":"Paul Bettany","born":"1971"}' | kg node "$PaulB" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 116 'Person' 'Ron Howard'
RonH=$(kg node new --with-labels Person)
printf %s '{"name":"Ron Howard","born":"1954"}' | kg node "$RonH" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"V for Vendetta","released":"2006","tagline":"Freedom! Forever!"}' | kg node "$VforVendetta" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 118 'Person' 'Natalie Portman'
NatalieP=$(kg node new --with-labels Person)
printf %s '{"name":"Natalie Portman","born":"1981"}' | kg node "$NatalieP" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 119 'Person' 'Stephen Rea'
StephenR=$(kg node new --with-labels Person)
printf %s '{"name":"Stephen Rea","born":"1946"}' | kg node "$StephenR" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 120 'Person' 'John Hurt'
JohnH=$(kg node new --with-labels Person)
printf %s '{"name":"John Hurt","born":"1940"}' | kg node "$JohnH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 121 'Person' 'Ben Miles'
BenM=$(kg node new --with-labels Person)
printf %s '{"name":"Ben Miles","born":"1967"}' | kg node "$BenM" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Speed Racer","released":"2008","tagline":"Speed has no limits"}' | kg node "$SpeedRacer" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 123 'Person' 'Emile Hirsch'
EmileH=$(kg node new --with-labels Person)
printf %s '{"name":"Emile Hirsch","born":"1985"}' | kg node "$EmileH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 124 'Person' 'John Goodman'
JohnG=$(kg node new --with-labels Person)
printf %s '{"name":"John Goodman","born":"1960"}' | kg node "$JohnG" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 125 'Person' 'Susan Sarandon'
SusanS=$(kg node new --with-labels Person)
printf %s '{"name":"Susan Sarandon","born":"1946"}' | kg node "$SusanS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 126 'Person' 'Matthew Fox'
MatthewF=$(kg node new --with-labels Person)
printf %s '{"name":"Matthew Fox","born":"1966"}' | kg node "$MatthewF" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 127 'Person' 'Christina Ricci'
ChristinaR=$(kg node new --with-labels Person)
printf %s '{"name":"Christina Ricci","born":"1980"}' | kg node "$ChristinaR" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 128 'Person' 'Rain'
Rain=$(kg node new --with-labels Person)
printf %s '{"name":"Rain","born":"1982"}' | kg node "$Rain" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Ninja Assassin","released":"2009","tagline":"Prepare to enter a secret world of assassins"}' | kg node "$NinjaAssassin" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 130 'Person' 'Naomie Harris'
NaomieH=$(kg node new --with-labels Person)
printf %s '{"name":"Naomie Harris"}' | kg node "$NaomieH" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"The Green Mile","released":"1999","tagline":"Walk a mile you'\''ll never "}' | kg node "$TheGreenMile" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 132 'Person' 'Michael Clarke Duncan'
MichaelD=$(kg node new --with-labels Person)
printf %s '{"name":"Michael Clarke Duncan","born":"1957"}' | kg node "$MichaelD" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 133 'Person' 'David Morse'
DavidM=$(kg node new --with-labels Person)
printf %s '{"name":"David Morse","born":"1953"}' | kg node "$DavidM" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 134 'Person' 'Sam Rockwell'
SamR=$(kg node new --with-labels Person)
printf %s '{"name":"Sam Rockwell","born":"1968"}' | kg node "$SamR" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 135 'Person' 'Gary Sinise'
GaryS=$(kg node new --with-labels Person)
printf %s '{"name":"Gary Sinise","born":"1955"}' | kg node "$GaryS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 136 'Person' 'Patricia Clarkson'
PatriciaC=$(kg node new --with-labels Person)
printf %s '{"name":"Patricia Clarkson","born":"1959"}' | kg node "$PatriciaC" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 137 'Person' 'Frank Darabont'
FrankD=$(kg node new --with-labels Person)
printf %s '{"name":"Frank Darabont","born":"1959"}' | kg node "$FrankD" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Frost/Nixon","released":"2008","tagline":"400 million people were waiting for the "}' | kg node "$FrostNixon" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 139 'Person' 'Frank Langella'
FrankL=$(kg node new --with-labels Person)
printf %s '{"name":"Frank Langella","born":"1938"}' | kg node "$FrankL" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 140 'Person' 'Michael Sheen'
MichaelS=$(kg node new --with-labels Person)
printf %s '{"name":"Michael Sheen","born":"1969"}' | kg node "$MichaelS" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 141 'Person' 'Oliver Platt'
OliverP=$(kg node new --with-labels Person)
printf %s '{"name":"Oliver Platt","born":"1960"}' | kg node "$OliverP" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Hoffa","released":"1992","tagline":"He didn'\''t want  He wanted "}' | kg node "$Hoffa" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 143 'Person' 'Danny DeVito'
DannyD=$(kg node new --with-labels Person)
printf %s '{"name":"Danny DeVito","born":"1944"}' | kg node "$DannyD" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 144 'Person' 'John C. Reilly'
JohnR=$(kg node new --with-labels Person)
printf %s '{"name":"John C. Reilly","born":"1965"}' | kg node "$JohnR" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Apollo 13","released":"1995","tagline":"Houston, we have a "}' | kg node "$Apollo13" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 146 'Person' 'Ed Harris'
EdH=$(kg node new --with-labels Person)
printf %s '{"name":"Ed Harris","born":"1950"}' | kg node "$EdH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 147 'Person' 'Bill Paxton'
BillPax=$(kg node new --with-labels Person)
printf %s '{"name":"Bill Paxton","born":"1955"}' | kg node "$BillPax" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Twister","released":"1996","tagline":"Don'\''t  Don'\''t Look "}' | kg node "$Twister" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 149 'Person' 'Philip Seymour Hoffman'
PhilipH=$(kg node new --with-labels Person)
printf %s '{"name":"Philip Seymour Hoffman","born":"1967"}' | kg node "$PhilipH" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 150 'Person' 'Jan de Bont'
JanB=$(kg node new --with-labels Person)
printf %s '{"name":"Jan de Bont","born":"1943"}' | kg node "$JanB" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Cast Away","released":"2000","tagline":"At the edge of the world, his journey "}' | kg node "$CastAway" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 152 'Person' 'Robert Zemeckis'
RobertZ=$(kg node new --with-labels Person)
printf %s '{"name":"Robert Zemeckis","born":"1951"}' | kg node "$RobertZ" set --stdin >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 214 'ACTED_IN' 'Tom Hanks' 'Cast Away'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$CastAway" --with-properties 'roles=Chuck Noland')
printf '[%3d/253] %-10s %s -> %s\n' 215 'ACTED_IN' 'Helen Hunt' 'Cast Away'
l=$(kg node "$HelenH" link --as ACTED_IN --with-nodes "$CastAway" --with-properties 'roles=Kelly Frears')
printf '[%3d/253] %-10s %s -> %s\n' 216 'DIRECTED' 'Robert Zemeckis' 'Cast Away'
l=$(kg node "$RobertZ" link --as DIRECTED --with-nodes "$CastAway")
printf '[%3d/171] %-6s %s\n' 153 'Movie' 'One Flew Over the Cuckoo'\''s Nest'
OneFlewOvertheCuckoosNest=$(kg node new --with-labels Movie)
printf %s '{"title":"One Flew Over the Cuckoo'\''s Nest","released":"1975","tagline":"If he'\''s crazy, what does that make you?"}' | kg node "$OneFlewOvertheCuckoosNest" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 154 'Person' 'Milos Forman'
MilosF=$(kg node new --with-labels Person)
printf %s '{"name":"Milos Forman","born":"1932"}' | kg node "$MilosF" set --stdin >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 217 'ACTED_IN' 'Jack Nicholson' 'One Flew Over the Cuckoo'\''s Nest'
l=$(kg node "$JackN" link --as ACTED_IN --with-nodes "$OneFlewOvertheCuckoosNest" --with-properties 'roles=Randle McMurphy')
printf '[%3d/253] %-10s %s -> %s\n' 218 'ACTED_IN' 'Danny DeVito' 'One Flew Over the Cuckoo'\''s Nest'
l=$(kg node "$DannyD" link --as ACTED_IN --with-nodes "$OneFlewOvertheCuckoosNest" --with-properties 'roles=Martini')
printf '[%3d/253] %-10s %s -> %s\n' 219 'DIRECTED' 'Milos Forman' 'One Flew Over the Cuckoo'\''s Nest'
l=$(kg node "$MilosF" link --as DIRECTED --with-nodes "$OneFlewOvertheCuckoosNest")
printf '[%3d/171] %-6s %s\n' 155 'Movie' 'Something'\''s Gotta Give'
SomethingsGottaGive=$(kg node new --with-labels Movie)
printf %s '{"title":"Something'\''s Gotta Give","released":"2003"}' | kg node "$SomethingsGottaGive" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 156 'Person' 'Diane Keaton'
DianeK=$(kg node new --with-labels Person)
printf %s '{"name":"Diane Keaton","born":"1946"}' | kg node "$DianeK" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 157 'Person' 'Nancy Meyers'
NancyM=$(kg node new --with-labels Person)
printf %s '{"name":"Nancy Meyers","born":"1949"}' | kg node "$NancyM" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"Bicentennial Man","released":"1999","tagline":"One robot'\''s 200 year journey to become an ordinary "}' | kg node "$BicentennialMan" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 159 'Person' 'Chris Columbus'
ChrisC=$(kg node new --with-labels Person)
printf %s '{"name":"Chris Columbus","born":"1958"}' | kg node "$ChrisC" set --stdin >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 226 'ACTED_IN' 'Robin Williams' 'Bicentennial Man'
l=$(kg node "$Robin" link --as ACTED_IN --with-nodes "$BicentennialMan" --with-properties 'roles=Andrew Marin')
printf '[%3d/253] %-10s %s -> %s\n' 227 'ACTED_IN' 'Oliver Platt' 'Bicentennial Man'
l=$(kg node "$OliverP" link --as ACTED_IN --with-nodes "$BicentennialMan" --with-properties 'roles=Rupert Burns')
printf '[%3d/253] %-10s %s -> %s\n' 228 'DIRECTED' 'Chris Columbus' 'Bicentennial Man'
l=$(kg node "$ChrisC" link --as DIRECTED --with-nodes "$BicentennialMan")
printf '[%3d/171] %-6s %s\n' 160 'Movie' 'Charlie Wilson'\''s War'
CharlieWilsonsWar=$(kg node new --with-labels Movie)
printf %s '{"title":"Charlie Wilson'\''s War","released":"2007","tagline":"A stiff  A little  A lot of  Who said they couldn'\''t bring down the Soviet "}' | kg node "$CharlieWilsonsWar" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 161 'Person' 'Julia Roberts'
JuliaR=$(kg node new --with-labels Person)
printf %s '{"name":"Julia Roberts","born":"1967"}' | kg node "$JuliaR" set --stdin >/dev/null 2>&1
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
printf %s '{"title":"The Polar Express","released":"2004","tagline":"This Holiday .. Believe"}' | kg node "$ThePolarExpress" set --stdin >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 233 'ACTED_IN' 'Tom Hanks' 'The Polar Express'
l=$(kg node "$TomH" link --as ACTED_IN --with-nodes "$ThePolarExpress")
kg link "$l" add roles 'Hero Boy' 'Father' 'Conductor' 'Hobo' 'Scrooge' 'Santa Claus' >/dev/null 2>&1
printf '[%3d/253] %-10s %s -> %s\n' 234 'DIRECTED' 'Robert Zemeckis' 'The Polar Express'
l=$(kg node "$RobertZ" link --as DIRECTED --with-nodes "$ThePolarExpress")
printf '[%3d/171] %-6s %s\n' 163 'Movie' 'A League of Their Own'
ALeagueofTheirOwn=$(kg node new --with-labels Movie)
printf %s '{"title":"A League of Their Own","released":"1992","tagline":"Once in a lifetime you get a chance to do something "}' | kg node "$ALeagueofTheirOwn" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 164 'Person' 'Madonna'
Madonna=$(kg node new --with-labels Person)
printf %s '{"name":"Madonna","born":"1954"}' | kg node "$Madonna" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 165 'Person' 'Geena Davis'
GeenaD=$(kg node new --with-labels Person)
printf %s '{"name":"Geena Davis","born":"1956"}' | kg node "$GeenaD" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 166 'Person' 'Lori Petty'
LoriP=$(kg node new --with-labels Person)
printf %s '{"name":"Lori Petty","born":"1963"}' | kg node "$LoriP" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 167 'Person' 'Penny Marshall'
PennyM=$(kg node new --with-labels Person)
printf %s '{"name":"Penny Marshall","born":"1943"}' | kg node "$PennyM" set --stdin >/dev/null 2>&1
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
printf %s '{"name":"Paul Blythe"}' | kg node "$PaulBlythe" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 169 'Person' 'Angela Scope'
AngelaScope=$(kg node new --with-labels Person)
printf %s '{"name":"Angela Scope"}' | kg node "$AngelaScope" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 170 'Person' 'Jessica Thompson'
JessicaThompson=$(kg node new --with-labels Person)
printf %s '{"name":"Jessica Thompson"}' | kg node "$JessicaThompson" set --stdin >/dev/null 2>&1
printf '[%3d/171] %-6s %s\n' 171 'Person' 'James Thompson'
JamesThompson=$(kg node new --with-labels Person)
printf %s '{"name":"James Thompson"}' | kg node "$JamesThompson" set --stdin >/dev/null 2>&1
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
