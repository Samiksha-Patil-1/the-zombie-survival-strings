import sys
import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(40, 762, "ZOMBIE: STRING OF SURVIVAL — MASTER RE-CREATION SPECIFICATION")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(40, 756, 572, 756)
        
        # Footer
        self.setFont("Helvetica", 8)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 42, 572, 42)
        self.drawString(40, 30, "Confidential — Zombie String of Survival Master Prompt & Architecture Blueprint")
        self.drawRightString(572, 30, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()

def create_prompt_box(title, content_list, prompt_style, header_style):
    elements = []
    if title:
        elements.append(Paragraph(f"<b>{title}</b>", header_style))
        elements.append(Spacer(1, 4))
    for p in content_list:
        elements.append(Paragraph(p, prompt_style))
        elements.append(Spacer(1, 4))
    
    t = Table([[elements]], colWidths=[532])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f8fafc")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#0284c7")),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def build_pdf(filename="ZOMBIE_STRING_OF_SURVIVAL_MASTER_PROMPT.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=40,
        rightMargin=40,
        topMargin=50,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#dc2626"),
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'Header1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Header2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=14,
        textColor=colors.HexColor("#0369a1"),
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        leftIndent=14,
        firstLineIndent=-10,
        spaceAfter=3
    )

    prompt_head_style = ParagraphStyle(
        'PromptHead',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0369a1")
    )

    prompt_box_style = ParagraphStyle(
        'PromptBoxText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0f172a")
    )

    story = []

    # Title & Header
    story.append(Paragraph("ZOMBIE: STRING OF SURVIVAL", title_style))
    story.append(Paragraph("THE DEFINITIVE COMPLETE MASTER RE-CREATION PROMPT & SPECIFICATION", subtitle_style))
    story.append(Paragraph("<b>Target Engine:</b> Three.js (r128) WebGL Web Game &nbsp;|&nbsp; <b>Prompt Mode:</b> 100% Zero-Loss Single Paste Re-Creation", body_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#dc2626"), spaceBefore=4, spaceAfter=10))

    # Core narrative callout
    narrative_p = Paragraph(
        "<b>CORE NARRATIVE PREMISE:</b><br/>"
        "<i>\"You are Alexei, trapped in a zombie-infested District 4, and you have 7 days to explore the city, "
        "collect resources, rescue survivors, manage your increasingly detectable base, adapt to enemies that "
        "respond to your playstyle, uncover the infection mystery, and finally escape from the harbor.\"</i>",
        body_style
    )
    narrative_table = Table([[narrative_p]], colWidths=[532])
    narrative_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fef2f2")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#ef4444")),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(narrative_table)
    story.append(Spacer(1, 10))

    # Section 1: The Master Copy-Paste Prompt
    story.append(Paragraph("SECTION 1: THE ONE-SHOT MASTER PROMPT (COPY-PASTE READY)", h1_style))
    story.append(Paragraph(
        "The boxes below form the complete, unified master prompt. You can copy and paste all parts together into "
        "any coding AI to re-create the exact game with 100% fidelity:", body_style
    ))
    story.append(Spacer(1, 4))

    # Prompt Part 1
    story.append(create_prompt_box(
        "PROMPT PART 1: CORE ARCHITECTURE & PROTAGONIST RIG (ALEXEI)",
        [
            "Build a complete, production-ready AAA 3D/4D/5D Survival Horror Web Game titled 'ZOMBIE: STRING OF SURVIVAL'.",
            "PREMISE: You are Alexei, trapped in a zombie-infested District 4, and you have 7 days to explore the city, collect resources, rescue survivors, manage your increasingly detectable base, adapt to enemies that respond to your playstyle, uncover the infection mystery, and finally escape from the harbor.",
            "TECH STACK: Vanilla HTML5, CSS3, JavaScript with Three.js (r128) bundled locally in 'js/three.min.js'. All 3D characters, survivors, and zombies MUST be constructed using procedural Three.js composite meshes and materials so the game requires zero external 3D model downloads (no .gltf/.fbx), loads instantly offline/Vercel, and avoids CORS issues.",
            "ALEXEI RIG: Build playerGroup at (-25, 0, -10). Torso: tactical jacket (BoxGeometry 0.72, 0.82, 0.44 color 0x2b333e), Kevlar plate carrier (0.62, 0.64, 0.12 color 0x18181b), 3 chest mag pouches (0.13, 0.18, 0.08), VHF radio with 0.35m whip antenna, combat knife in chest sheath, duty belt with brass buckle, right hip holster, and olive shemagh neck scarf (CylinderGeometry 0.16, 0.22, 0.20). Backpack: 60L rucksack (0.54, 0.72, 0.30) with strapped horizontal bedroll (0.10, 0.10, 0.64) across top with dual buckles, side pouches, water canteen, strapped hatchet (0.52m handle), and radio antenna. Head: sculpted face (SphereGeometry 0.23, skin tone 0xdca97a) with 3D eyes (white sclera, dark pupils), brow ridges, defined nose, 5 o'clock stubble shadow, tactical dark beanie cap with folded rim, hair strands, and comms earpiece with boom mic. Limbs: articulated arms with rolled sleeves, digital watch with cyan LED screen (0x00f5d4), fingerless combat gloves, TPS weapon rig. Cargo pants with thigh pockets, composite hard knee pads (0.22, 0.18, 0.08), and lugged combat boots (0.24, 0.22, 0.36) with sole treads. Camera: auto-hide head in FPS mode (V) to avoid camera clipping; reveal complete character in TPS (V) and Drone (T) views with weapon pitch aiming."
        ],
        prompt_box_style, prompt_head_style
    ))
    story.append(Spacer(1, 8))

    # Prompt Part 2
    story.append(create_prompt_box(
        "PROMPT PART 2: NPC SURVIVORS & HORROR ZOMBIE ANATOMY",
        [
            "NPC SURVIVORS (3 Unique Characters):",
            "1. Dr. Evelyn Reed (Doctor, 50, -48): White lab coat (0.64, 0.92, 0.40) over turquoise scrubs (0x0d9488), stethoscope torus tube with silver chestpiece disc, Red Cross armband (0xef4444), wireframe glasses, ponytail hair bun, light blue surgical gloves, holding illuminated cyan antiviral sample vial.",
            "2. Marcus Vance (Engineer, -34, -42): Safety orange boiler suit (0xea580c) with grease smudges, dual brass welding goggles on forehead, thick dark brown beard, heavy leather toolbelt with 3D pipe wrench (0.42m cylinder + box head) and hammer, steel-toed work boots.",
            "3. Sgt. Darius Cole (Soldier, -22, -22): Digital woodland camo BDU (0x3f4f2e) with tactical assault vest (0x1f2937), Kevlar helmet with NVG mount and chinstrap, facial combat scar over eye, slung assault rifle (0.10, 0.16, 0.85), military jump boots.",
            "Survivors feature idle breathing, head tracking that turns to look at Alexei within 8m, and overhead rotating role beacons.",
            "HORROR ZOMBIES (Visceral Undead Anatomy & 4 Archetypes):",
            "Necrotic Flesh & Posture: Sickly olive-green skin (0x44533c, roughness 0.92). Torso hunched forward 0.38 rad (25 deg) with 5 protruding spinal vertebrae bone spheres (0.055) along back. Gaping chest wound (0.36, 0.45, 0.08, color 0x5e0b0b) with 3 curved TorusGeometry rib bones protruding out with dripping blood.",
            "Gaunt Skull & Snarling Jaw: Emaciated skull with hollow black sockets, cranial trauma with exposed white bone, and glowing infected eyes. Separate lower jaw hinged open 0.35 rad in a snarl with dark throat interior and dual rows of 7 sharp yellow bloody cone teeth (0.018, 0.06).",
            "Claws & Bare Foot: Reaching arms rotated forward -1.15 rad with claw hands having 4 splayed bony necrotic fingers + thumb with cone talons. Left leg has exposed white kneecap bone sphere in torn knee; right leg ends in bare rotting foot with 5 blackened toe boxes dragging on pavement.",
            "4 Archetypes: Hunter (standard walker, speed 3.2, HP 55), Swarm (feral sprinter, speed 5.2, HP 42, 4 mutated spine bone spikes, rapid sprint), Ambusher (speed 4.6, HP 38, dark chitin back plates, elbow bone spurs, glowing cyan eyes), Tank (1.85x scale, HP 240, 6 pulsating toxic boils 0x84cc16, embedded rebar, colossal sledge-fist).",
            "Animations & FX: Asymmetric shambling limp (one leg strides while bare foot drags), head twitches, vicious clawing slash attacks when close (<2.8m), mesh damage flash (0xff2222), and ragdoll collapse on death with an expanding dark blood pool decal (CircleGeometry radius 1.15-2.4m, color 0x3d0707)."
        ],
        prompt_box_style, prompt_head_style
    ))
    story.append(Spacer(1, 8))

    # Page Break for structured continuation
    story.append(PageBreak())

    # Prompt Part 3
    story.append(create_prompt_box(
        "PROMPT PART 3: COMBAT, BASE HEAT, WEB AUDIO SYNTH & MULTI-TAB INTERFACE",
        [
            "COMBAT & WEAPONS:",
            "WASD move, Shift sprint (stamina drain, 70 noise), C crouch (cuts speed to 3.5, cuts noise to 15, reduces detection radius), Mouse look (Pointer Lock + drag fallback), Left Click attack, Right Click ADS zoom (FOV 65 down to 42), 1 for Pistol, 2 for Barbed Bat, R to reload, E to interact, T for Drone, V for 1st/3rd View.",
            "Suppressed Pistol: 24 rounds, slide recoil, ray-cone hitscan detection (dot>0.85 & lateralDist<2.4m or dist<4.5m & dot>0.45), hit marker overlay (X), muzzle flash.",
            "Barbed Bat: 120 melee damage, wide swing arc animation, barbed wire coils.",
            "BASE HEAT & INFECTION DOME:",
            "Safehouse generator at (-40, 0, -40) generates an expanding pulsating orange wireframe heat dome (radius = heat * 2.0, up to 90m+) that attracts distant zombies to base.",
            "Zombie hits increase infection (0-100%), dynamically driving sensory degradation: low-pass filter sweeps down from 22kHz to 500Hz, heartbeat speeds up, red bio-veins creep into view.",
            "WEB AUDIO API SYNTHESIZER (audio.js):",
            "Zero external audio files: 58Hz sawtooth generator rumble, heartbeat pulses (65Hz->35Hz sine ramps), gunshot noise bursts (exponential 1200Hz->80Hz lowpass filter), zombie growls (sawtooth sweep), fleshy impacts, and master lowpass filter cutoff.",
            "HUD & MULTI-TAB INTERFACE:",
            "Tab 01: 3D Survival World with top compass bar (0 deg | N), action toolbar (Drone, 1st/3rd View, Pistol, Bat, Restart), crosshair, Hunted warning banner, damage flash vignette, and game over replay modal.",
            "Tab 02: DAG Decision Tree interactive canvas graph tracking committed nodes and branches.",
            "Tab 03: Adaptive AI Director Radar visualizing Stealth, Combat, and Velocity metrics.",
            "Tab 04: Thermal Heat Dissipation 2D Radar Canvas.",
            "Tab 05: Sensory Infection Bio-Vein Distortion Canvas with FOV indicator.",
            "Tab 06: Tactical 2D Top-Down Arena Simulator with flashlight cone.",
            "Server: Node.js server.js serving static files on port 3000, and vercel.json for direct deployment."
        ],
        prompt_box_style, prompt_head_style
    ))
    story.append(Spacer(1, 12))

    # Section 2: Technical Breakdown
    story.append(Paragraph("SECTION 2: COMPONENT SPECIFICATIONS & MATHEMATICAL BLUEPRINTS", h1_style))
    story.append(Paragraph("This reference section documents exact coordinate offsets, geometry dimensions, and algorithms:", body_style))

    story.append(Paragraph("2.1 Alexei Protagonist Model Blueprint", h2_style))
    story.append(Paragraph("• <b>Head Group:</b> SphereGeometry(0.23, 16, 14) scaled (0.92, 1.08, 1.0) color 0xdca97a. Dual eye spheres (0.038) with pupils (0.018) at z=0.20. Brow ridges angled 0.12 rad. Nose wedge at z=0.23. Cylinder stubble shadow at y=-0.14. Tactical beanie cap SphereGeometry(0.245) with TorusGeometry brim (0.235, 0.045). Comms earpiece with boom mic cylinder angled PI/3.", bullet_style))
    story.append(Paragraph("• <b>Torso Group:</b> Jacket BoxGeometry(0.72, 0.82, 0.44) color 0x2b333e. Plate carrier BoxGeometry(0.62, 0.64, 0.12) color 0x18181b. 3 mag pouches (0.13, 0.18, 0.08) at z=0.27. VHF radio with 0.35m antenna. Combat knife in chest sheath. Duty belt with brass buckle and hip holster. Olive shemagh scarf CylinderGeometry(0.16, 0.22, 0.20).", bullet_style))
    story.append(Paragraph("• <b>Backpack Group:</b> 60L rucksack BoxGeometry(0.54, 0.72, 0.30) color 0x374151. Bedroll CylinderGeometry(0.10, 0.10, 0.64) strapped across top with dual TorusGeometry buckles. Dual side pouches, canteen, survival hatchet (0.52m handle), and whip antenna.", bullet_style))
    story.append(Paragraph("• <b>Articulated Limbs:</b> Left arm has upper sleeve, bare forearm, digital watch with cyan LED face (0x00f5d4), and fingerless glove. Right arm holds TPS weapon rig. Left and right legs have upper thighs with outer pockets, composite hard knee pads BoxGeometry(0.22, 0.18, 0.08), shins, and combat boots with sole treads BoxGeometry(0.25, 0.06, 0.40).", bullet_style))

    story.append(Paragraph("2.2 Horror Zombie Anatomy Blueprint", h2_style))
    story.append(Paragraph("• <b>Necrotic Anatomy:</b> Sickly olive-green skin 0x44533c (roughness 0.92). Torso hunched forward 0.38 rad (25 deg) with 5 protruding spinal vertebrae spheres (0.055) along back. Gaping chest wound (0.36, 0.45, 0.08) color 0x5e0b0b with 3 curved TorusGeometry(0.14, 0.022, 6, 8, 0.65*PI) rib bones protruding outward.", bullet_style))
    story.append(Paragraph("• <b>Gaunt Skull & Snarling Jaw:</b> Hollow black eye sockets with glowing infected eyes (Hunter: red 0xef4444, Swarm: amber 0xf59e0b, Ambusher: cyan 0x00f5d4, Tank: green 0x22c55e). Separate lower jaw hinged at z=0.05, rotated open 0.35 rad with bloody throat cavity and dual rows of 7 sharp cone teeth (0.018, 0.06) color 0xfef08a.", bullet_style))
    story.append(Paragraph("• <b>Claws & Bare Foot:</b> Reaching arms rotated forward -1.15 rad with claw hands having 4 splayed bony fingers + thumb with cone talons. Left leg has exposed white kneecap bone sphere (0.065) in torn knee; right leg ends in bare rotting foot with 5 blackened toe boxes dragging on pavement.", bullet_style))
    story.append(Paragraph("• <b>Mutant Archetypes:</b> Swarm has 4 mutated cone bone spikes (0.35m) along spine; Ambusher has dark chitin back plates and elbow bone spurs; Tank is scaled 1.85x, has 6 glowing toxic boils (0x84cc16), embedded rebar, and colossal sledge-fist BoxGeometry(0.34, 0.38, 0.32).", bullet_style))

    # Page Break for matrix
    story.append(PageBreak())

    story.append(Paragraph("SECTION 3: COMPETITION BREAKDOWN & FEATURE MATRIX", h1_style))
    story.append(Paragraph(
        "For competition submissions and technical reviews, this matrix defines what features are fully playable "
        "in the real-time 3D engine versus telemetry and conceptual references:", body_style
    ))
    story.append(Spacer(1, 4))

    matrix_data = [
        ["System Component", "Runtime Status", "Playable In-Game Functionality"],
        ["3D Survival Horror Engine", "100% Implemented", "Three.js WebGL city district, day/night cycle, burning embers, lighting"],
        ["Alexei Player 3D Rig", "100% Implemented", "Detailed head, cap, vest, rucksack, articulated legs, TPS weapons"],
        ["NPC Survivors (3 Roles)", "100% Implemented", "Dr. Reed, Marcus, Sgt. Cole models with idle breathing, head tracking, quests"],
        ["Horror Zombies (4 Types)", "100% Implemented", "Rotting flesh, exposed ribs, snarling teeth, bare foot, claw attacks, blood decals"],
        ["FPS / TPS / Drone Camera", "100% Implemented", "1st person, 3rd person with weapon pitch aim, 80m reconnaissance drone"],
        ["Combat & Hitscan Detection", "100% Implemented", "Suppressed pistol, barbed bat, recoil, hit markers, damage flashes"],
        ["Base Heat Attraction Dome", "100% Implemented", "Pulsating orange wireframe dome attracting zombies into safehouse"],
        ["Web Audio Synthesizer", "100% Implemented", "Generator rumble, heartbeat, gunshots, zombie growls, infection muffling"],
        ["DAG Narrative Decision Tree", "UI Simulation", "2D interactive canvas graph tracking commitment paths and branch nodes"],
        ["AI Director Radar", "UI Telemetry", "Tri-axis player playstyle telemetry (Stealth, Combat, Velocity)"],
        ["Thermal Heat Dissipation Radar", "UI Radar", "2D top-down heatmap simulation of acoustic and thermal dissipation"],
        ["Sensory Vein Distortion", "UI Post-Process", "Procedural red bio-vein canvas simulating peripheral tunnel vision"],
        ["Tactical 2D Arena", "Playable 2D Fallback", "HTML5 top-down 2D canvas survival simulator with flashlight cone"]
    ]

    matrix_table = Table(matrix_data, colWidths=[130, 95, 307])
    matrix_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#0f172a")),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('FONTNAME', (0,1), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,1), (-1,-1), 7.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.HexColor("#ffffff"), colors.HexColor("#f8fafc")]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    story.append(matrix_table)
    story.append(Spacer(1, 14))

    # Verification checklist
    story.append(Paragraph("SECTION 4: 10-POINT AI GENERATION VERIFICATION CHECKLIST", h1_style))
    checklist_items = [
        "1. Does the 3D player character render Alexei with tactical vest, backpack, beanie cap, radio, watch, and combat boots?",
        "2. Does pressing 'V' cleanly toggle between First-Person and Third-Person view without camera head clipping?",
        "3. Does pressing 'T' toggle the free-flying tactical reconnaissance drone at 80m altitude?",
        "4. Do the zombies exhibit rotting green/purple flesh, exposed ribcage with 3D rib bones, and snarling jaws with fangs?",
        "5. Do the zombies have an asymmetric shambling limp and drag a bare rotting foot across the pavement?",
        "6. Do dead zombies collapse flat into an expanding dark blood pool decal (0x3d0707)?",
        "7. Do all 3 NPC survivors (Dr. Evelyn Reed, Marcus Vance, Sgt. Darius Cole) render with distinct role gear?",
        "8. Does the diesel generator create an interactive expanding base heat dome that pulls distant zombies?",
        "9. Does the Web Audio API synthesizer generate gunfire, heartbeat, generator rumble, and lowpass infection muffling?",
        "10. Does clicking 'RESTART GAME' on the HUD or game-over screen purge all corpses and cleanly restart Day 1?"
    ]
    for item in checklist_items:
        story.append(Paragraph(item, bullet_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[OK] Master prompt PDF generated successfully at: {os.path.abspath(filename)}")

if __name__ == "__main__":
    out_file = sys.argv[1] if len(sys.argv) > 1 else "ZOMBIE_STRING_OF_SURVIVAL_MASTER_PROMPT.pdf"
    build_pdf(out_file)
