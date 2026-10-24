from pathlib import Path
P=Path(__file__).resolve().parents[1] / 'public' / 'assets'
HEAD='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 700" role="img" aria-label="COCIOCO original product illustration"><defs>
<filter id="shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="19" stdDeviation="16" flood-color="#50376b" flood-opacity=".21"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
<linearGradient id="lilac" x2="1" y2="1"><stop stop-color="#aa80eb"/><stop offset="1" stop-color="#6d46b8"/></linearGradient>
<linearGradient id="pink" x2="1" y2="1"><stop stop-color="#ffc5e8"/><stop offset=".55" stop-color="#ff82ca"/><stop offset="1" stop-color="#e566bb"/></linearGradient>
<linearGradient id="lime" x2="1" y2="1"><stop stop-color="#f7ffbb"/><stop offset="1" stop-color="#c8e863"/></linearGradient>
<pattern id="check" width="76" height="76" patternUnits="userSpaceOnUse"><rect width="76" height="76" fill="#f9b3dd"/><rect width="38" height="38" fill="#ab8be4"/><rect x="38" y="38" width="38" height="38" fill="#ab8be4"/></pattern>
<pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="2" fill="#7e58c7" opacity=".22"/></pattern>
</defs>'''
TAIL='</svg>'
def write(name,body): (P/name).write_text(HEAD+body+TAIL)

def spark(x,y,s=1,color='#dbed75'):
 return f'<path transform="translate({x} {y}) scale({s})" d="M0 -24 7 -7 24 0 7 7 0 24 -7 7 -24 0 -7 -7Z" fill="{color}" stroke="#282126" stroke-width="3" stroke-linejoin="round"/>'

def star(x,y,s=1,color='#fff'):
 return f'<path transform="translate({x} {y}) scale({s})" d="M0 -42 11 -13 42 0 11 12 0 42 -11 12 -42 0 -11 -13Z" fill="{color}" stroke="#27212c" stroke-width="4" stroke-linejoin="round"/>'

write('binder.svg',f'''
<rect width="700" height="700" rx="48" fill="#d7c0ff"/><circle cx="560" cy="150" r="195" fill="#f8f3ff" opacity=".53"/><path d="M-50 570Q250 345 740 690" stroke="#fff" stroke-width="80" opacity=".44" fill="none"/>
<ellipse cx="352" cy="600" rx="223" ry="34" fill="#7556bc" opacity=".15" filter="url(#soft)"/>
<g transform="rotate(-11 352 337)" filter="url(#shadow)">
<rect x="171" y="94" width="356" height="492" rx="37" fill="#6945ac" stroke="#26202a" stroke-width="7"/>
<rect x="184" y="99" width="331" height="470" rx="28" fill="url(#check)" stroke="#26202a" stroke-width="4"/>
<rect x="217" y="141" width="257" height="359" rx="20" fill="#fee5f4" fill-opacity=".89" stroke="#6d49a7" stroke-width="6"/>
<rect x="231" y="157" width="228" height="323" rx="14" fill="#fff6fa"/>
<g transform="translate(345 270)"><path d="M-85 -100C-155 -205 -205 -112 -158 -37l75 100M83 -100C151 -209 199 -104 158 -37L80 61" fill="#fff9fe" stroke="#222" stroke-width="7" stroke-linejoin="round"/><circle cx="0" cy="11" r="118" fill="#fff6fa" stroke="#222" stroke-width="7"/><ellipse cx="-40" cy="17" rx="9" ry="15" fill="#27212c"/><ellipse cx="40" cy="17" rx="9" ry="15" fill="#27212c"/><ellipse cx="-65" cy="52" rx="17" ry="10" fill="#ff9ccc"/><ellipse cx="65" cy="52" rx="17" ry="10" fill="#ff9ccc"/><path d="M-10 41q10 12 20 0" fill="none" stroke="#27212c" stroke-width="6" stroke-linecap="round"/><path d="m0 -33 13 14 19-2-5 20-15 9-16-13z" fill="#d7f38a" stroke="#222" stroke-width="4"/></g>
<text x="345" y="445" text-anchor="middle" font-family="Arial Black, sans-serif" font-weight="900" font-size="31" letter-spacing="3" fill="#7855b8">DREAM CLUB</text>
<g fill="#fbdff6" stroke="#282126" stroke-width="5"><ellipse cx="185" cy="210" rx="17" ry="9"/><ellipse cx="185" cy="305" rx="17" ry="9"/><ellipse cx="185" cy="402" rx="17" ry="9"/><ellipse cx="185" cy="499" rx="17" ry="9"/></g>
</g>
{spark(570,118,1.4)}{spark(105,540,.7,'#ff83c9')}{star(605,495,.65,'#fff')}
<rect x="59" y="72" width="149" height="53" rx="26" fill="#dcf58f" stroke="#282126" stroke-width="4" transform="rotate(-10 59 72)"/><text x="132" y="102" transform="rotate(-10 132 102)" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="900" fill="#342b37">so dreamy ✧</text>
''')

write('keychain.svg',f'''
<rect width="700" height="700" rx="48" fill="#ffc3e3"/><circle cx="360" cy="333" r="276" fill="#ffe0f0"/><path d="M-120 580Q270 490 900 680" stroke="#eaa1dc" stroke-width="94" fill="none" opacity=".5"/>
<g filter="url(#shadow)"><circle cx="359" cy="147" r="64" fill="none" stroke="#b4b5c4" stroke-width="27"/><circle cx="359" cy="147" r="52" fill="none" stroke="#fff" stroke-width="6" opacity=".9"/><path d="M359 207 359 248" stroke="#bec0ca" stroke-width="18" stroke-linecap="round"/>
<path d="M357 297C272 177 110 248 143 388c23 93 130 162 214 230 84-68 193-137 216-230 34-139-131-211-216-91Z" fill="url(#pink)" stroke="#2a2530" stroke-width="12" stroke-linejoin="round"/>
<path d="M356 327C294 244 183 281 206 381c14 62 87 115 150 162 62-47 136-100 151-162 20-99-91-136-151-54Z" fill="#ffb5df" stroke="#fff0fa" stroke-width="5"/>
<path d="M360 391 377 428 418 433 388 462 397 502 360 483 324 502 331 461 302 433 343 428Z" fill="#d9f18f" stroke="#2a2530" stroke-width="8" stroke-linejoin="round"/>
<path d="M224 318Q248 282 281 287" stroke="#fff" stroke-width="17" stroke-linecap="round" opacity=".7" fill="none"/></g>
<g fill="#9a68d6" stroke="#282126" stroke-width="4"><circle cx="427" cy="216" r="27"/><circle cx="465" cy="198" r="26"/><circle cx="499" cy="226" r="26"/><circle cx="505" cy="263" r="25"/></g>
{spark(125,182,1,'#d9f18f')}{spark(579,487,.8,'#9e69d5')}{star(142,504,.54,'#fff')}
''')

write('photocards.svg',f'''
<rect width="700" height="700" rx="48" fill="#e1f1ad"/><rect x="0" y="0" width="700" height="700" fill="url(#dots)"/><circle cx="350" cy="355" r="287" fill="#f9ffd3" opacity=".55"/>
<g filter="url(#shadow)"><g transform="rotate(-18 320 341)"><rect x="132" y="155" width="304" height="433" rx="25" fill="#a177e4" stroke="#2d2430" stroke-width="7"/><rect x="148" y="170" width="271" height="402" rx="15" fill="#eac9ff"/><circle cx="280" cy="359" r="112" fill="#ffc6e4"/><path d="M205 379Q209 245 290 248Q370 258 364 383Z" fill="#2b2531"/><ellipse cx="282" cy="379" rx="85" ry="101" fill="#ffe0d1"/><path d="M197 349Q176 255 260 248Q341 225 368 341Q335 331 315 285Q287 340 197 349Z" fill="#29232d"/><circle cx="255" cy="381" r="6" fill="#241e28"/><circle cx="310" cy="381" r="6" fill="#241e28"/><path d="M272 423q14 9 26-1" stroke="#a84669" stroke-width="5" fill="none" stroke-linecap="round"/><path d="m185 510h208" stroke="#a177e4" stroke-width="6" stroke-dasharray="12 10"/></g>
<g transform="rotate(13 409 347)"><rect x="289" y="107" width="283" height="446" rx="24" fill="#ff94cc" stroke="#2d2430" stroke-width="7"/><rect x="308" y="123" width="246" height="412" rx="14" fill="#ffdbed"/><ellipse cx="434" cy="345" rx="110" ry="136" fill="#bba0ed"/><path d="M356 353Q331 242 420 226Q506 218 512 343L500 424H369Z" fill="#2c2335"/><ellipse cx="432" cy="363" rx="83" ry="99" fill="#ffe4d6"/><path d="M351 332Q345 232 433 219Q498 223 516 334Q461 313 437 279Q401 323 351 332Z" fill="#2c2335"/><ellipse cx="405" cy="376" rx="5" ry="8" fill="#2c2335"/><ellipse cx="461" cy="376" rx="5" ry="8" fill="#2c2335"/><path d="M420 419q15 12 29 0" stroke="#b84975" stroke-width="5" fill="none" stroke-linecap="round"/><text x="434" y="505" text-anchor="middle" font-size="19" font-weight="900" font-family="Arial,sans-serif" fill="#8457cb">STAR GIRL ☆</text></g></g>
{star(124,145,.7,'#ff9fcf')}{spark(592,561,1.2,'#a277e0')}{spark(117,545,.65,'#fff')}
''')

write('cardholder.svg',f'''
<rect width="700" height="700" rx="48" fill="#eed2ff"/><path d="M0 128Q350 310 700 107" stroke="#f5a9d9" stroke-width="90" fill="none" opacity=".7"/><circle cx="360" cy="348" r="277" fill="#f8ecff" opacity=".5"/>
<g filter="url(#shadow)" transform="rotate(-10 348 357)"><rect x="213" y="104" width="293" height="440" rx="39" fill="url(#lilac)" stroke="#282126" stroke-width="9"/><rect x="236" y="135" width="249" height="377" rx="24" fill="#b697e9" stroke="#f7e6ff" stroke-width="7"/><path d="M255 169h208v136q-97 110-208 0Z" fill="#ffe1f2" stroke="#282126" stroke-width="6"/><path d="M359 208c-39-50-111-4-72 46l73 62 75-62c36-53-33-95-76-46Z" fill="#ff8acb" stroke="#312631" stroke-width="5"/><rect x="259" y="375" width="205" height="106" rx="20" fill="#e5f596" stroke="#282126" stroke-width="5"/><text x="361" y="418" fill="#7c5ac4" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="24">SWEET</text><text x="361" y="451" fill="#7c5ac4" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="24">ESCAPE ♡</text></g>
<path d="M342 111Q320 36 387 35T454 111" fill="none" stroke="#eeb7e6" stroke-width="28"/><path d="M342 111Q320 36 387 35T454 111" fill="none" stroke="#2d2232" stroke-width="4" stroke-dasharray="8 10"/>
{star(137,373,.9,'#fff')}{spark(577,187,.9,'#d4ed79')}{spark(542,569,.65,'#ff93c9')}
''')

write('fonts.svg',f'''
<rect width="700" height="700" rx="48" fill="#d7f0bd"/><path d="M0 60h700M0 144h700M0 228h700M0 312h700M0 396h700M0 480h700M0 564h700M0 648h700" stroke="#fff" stroke-width="3" opacity=".25"/>
<g filter="url(#shadow)" transform="rotate(-8 360 344)"><rect x="118" y="100" width="472" height="503" rx="21" fill="#fff4f9" stroke="#29232d" stroke-width="9"/><rect x="144" y="126" width="420" height="450" rx="13" fill="#fee1f4"/><rect x="144" y="126" width="420" height="91" rx="13" fill="#9d72dd"/><text x="163" y="182" fill="#fff" font-family="Arial,sans-serif" font-weight="900" font-size="23" letter-spacing="4">COCIOCO CREATOR KIT</text><text x="152" y="342" fill="#302435" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="124" letter-spacing="-12">POP</text><text x="161" y="459" fill="#8b54d7" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="137" letter-spacing="-12">TYPE!</text><path d="M163 494h372" stroke="#29232d" stroke-width="6"/><text x="172" y="533" fill="#302435" font-family="monospace" font-weight="bold" font-size="19" letter-spacing="2">4 CREATIVE FONTS • OTF/TTF</text></g>
{spark(101,124,.75,'#fc94c8')}{star(591,555,.75,'#d8ed7b')}{spark(591,263,.9,'#fff')}
''')

write('elements.svg',f'''
<rect width="700" height="700" rx="48" fill="#ffd4e9"/><rect x="26" y="26" width="648" height="648" rx="40" stroke="#bf8ed8" stroke-width="5" stroke-dasharray="12 17" fill="none"/>
<g filter="url(#shadow)">
<path d="M207 177C153 113 60 157 82 241c12 51 74 100 124 139 51-39 113-88 124-139 23-85-74-128-123-64Z" fill="url(#pink)" stroke="#282126" stroke-width="9"/>
<path d="m469 128 21 72 75 21-75 21-21 72-21-72-72-21 72-21Z" fill="url(#lime)" stroke="#282126" stroke-width="8" stroke-linejoin="round"/>
<path d="M142 473c-42-45 19-101 64-60 44-46 105 12 64 57l-65 67Z" fill="#b48ae3" stroke="#282126" stroke-width="8"/>
<circle cx="505" cy="485" r="100" fill="#d5adf4" stroke="#282126" stroke-width="9"/><path d="M449 489q23 48 54 0 33 47 56-2" stroke="#27212c" stroke-width="8" stroke-linecap="round" fill="none"/><ellipse cx="465" cy="455" rx="10" ry="15" fill="#27212c"/><ellipse cx="541" cy="455" rx="10" ry="15" fill="#27212c"/>
<circle cx="356" cy="346" r="59" fill="#a671da" stroke="#282126" stroke-width="9"/><path d="m356 313 13 22 26 7-20 18 1 26-20-13-22 13 4-26-19-18 25-7z" fill="#f8e59c" stroke="#282126" stroke-width="4"/>
</g>{star(115,357,.5,'#fff')}{star(604,129,.55,'#fff')}{spark(372,576,.6,'#d9ef82')}
<rect x="263" y="66" width="179" height="55" rx="26" fill="#fdf8f6" stroke="#282126" stroke-width="4" transform="rotate(7 263 66)"/><text x="355" y="102" text-anchor="middle" fill="#8255cb" font-family="Arial,sans-serif" font-weight="900" font-size="24" transform="rotate(7 355 102)">80+ CUTIES!</text>
''')

write('templates.svg',f'''
<rect width="700" height="700" rx="48" fill="#dac7ff"/><path d="m-50 550 740-410" stroke="#ffb6dd" stroke-width="96" opacity=".65"/>
<g filter="url(#shadow)"><g transform="rotate(-14 260 332)"><rect x="92" y="160" width="295" height="401" rx="24" stroke="#27212c" stroke-width="8" fill="#e9f6ad"/><rect x="113" y="183" width="252" height="47" rx="12" fill="#fff5ff"/><circle cx="139" cy="207" r="7" fill="#ef84bf"/><circle cx="160" cy="207" r="7" fill="#9a70e6"/><circle cx="181" cy="207" r="7" fill="#c3e66c"/><text x="232" y="338" font-family="Arial Black,Arial,sans-serif" font-size="78" text-anchor="middle" font-weight="900" fill="#8057c9">CUTE</text><text x="232" y="410" font-family="Arial Black,Arial,sans-serif" font-size="81" text-anchor="middle" font-weight="900" fill="#ef84bf">STUFF</text><path d="m123 450 209 0" stroke="#282126" stroke-width="7" stroke-dasharray="14 12"/></g>
<g transform="rotate(13 436 332)"><rect x="309" y="107" width="308" height="428" rx="24" stroke="#27212c" stroke-width="8" fill="#ffc2e2"/><rect x="326" y="124" width="274" height="67" rx="14" fill="#865ed0"/><text x="462" y="166" font-family="Arial,sans-serif" font-size="24" text-anchor="middle" font-weight="900" fill="#fff">CREATIVE CLUB</text><path d="M462 249c-47-60-133 4-78 64l78 68 78-68c54-60-32-124-78-64Z" fill="#e8f5a1" stroke="#282126" stroke-width="7"/><text x="465" y="462" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="66" font-weight="900" fill="#8459ca">POST!</text></g></g>
{spark(98,124,1,'#fff')}{spark(610,556,.85,'#d9ef82')}
''')

# pixel heart as pixel grid
pixels=["00110001100","01111011110","11111111111","11111111111","01111111110","00111111100","00011111000","00001110000","00000100000"]
px=''.join(f'<rect x="{194+x*30}" y="{178+y*30}" width="30" height="30" fill="#8b60d2"/>' for y,row in enumerate(pixels) for x,v in enumerate(row) if v=='1')
write('pixels.svg',f'''
<rect width="700" height="700" rx="48" fill="#eaf3a1"/><rect width="700" height="700" fill="url(#dots)"/>
<g filter="url(#shadow)"><rect x="92" y="105" width="516" height="478" rx="42" fill="#fff5fc" stroke="#282126" stroke-width="8"/><rect x="117" y="130" width="466" height="426" rx="25" fill="#ffd7ec"/><g>{px}</g><path d="M205 220h44v16h-44" fill="#f9c0e4" opacity=".6"/></g>
<rect x="102" y="82" width="179" height="54" rx="27" fill="#ff94c8" stroke="#282126" stroke-width="5" transform="rotate(-11 102 82)"/><text x="192" y="118" text-anchor="middle" font-size="22" font-weight="900" font-family="Arial,sans-serif" transform="rotate(-11 192 118)">PIXEL LOVE</text>
{star(593,134,.75,'#fff')}{spark(117,561,.85,'#ae81df')}{spark(596,581,.8,'#ff94c8')}
''')
print('Generated',len(list(P.glob('*.svg'))),'illustrations')
