"""AZ Villa: preserve the editable Thrixel GLB; build an original Blender architectural scene.
Blender 4.x: blender -b --python blender/architectural_flythrough.py -- --glb assets/villa_main_editable.glb --output outputs --resolution 1920 1080 --samples 96
Optional: add --render to render PNG sequence. Encode with ffmpeg separately after verifying frames.
"""
import bpy
import sys, os, math, argparse, random
from mathutils import Vector
from pathlib import Path

def args_from_cli():
    a = argparse.ArgumentParser()
    a.add_argument("--glb", required=True)
    a.add_argument("--output", default="outputs")
    a.add_argument("--resolution", type=int, nargs=2, default=[1920,1080])
    a.add_argument("--samples", type=int, default=96)
    a.add_argument("--render", action="store_true")
    return a.parse_args(sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else [])

def mat(name, rgba, metallic=0, roughness=.5, transmission=0):
    m=bpy.data.materials.new(name)
    m.diffuse_color=(*rgba,1);m.use_nodes=True
    b=m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value=(*rgba,1)
    b.inputs["Metallic"].default_value=metallic
    b.inputs["Roughness"].default_value=roughness
    b.inputs["Transmission Weight"].default_value=transmission
    return m

def block(name, location, scale, material, bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    ob=bpy.context.object;ob.name=name
    ob.dimensions=scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    ob.data.materials.append(material)
    if bevel:
        mod=ob.modifiers.new("Realistic machined edges", "BEVEL")
        mod.width=bevel;mod.segments=2
        ob.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return ob

def sphere(name,location,size,material):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=18, ring_count=12, radius=1, location=location)
    o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(material);return o

def area(name, position, power, shape="DISK", size=7, color=(1,1,1)):
    d=bpy.data.lights.new(name,"AREA");d.energy=power;d.shape=shape;d.size=size;d.color=color
    ob=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(ob);ob.location=position
    direction=Vector((0,0,2))-ob.location
    ob.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    return ob

def create():
    args=args_from_cli()
    out=Path(args.output).resolve();out.mkdir(parents=True,exist_ok=True)
    source=Path(args.glb).resolve()
    if not source.exists(): raise FileNotFoundError(f"Missing editable villa GLB: {source}")
    bpy.ops.object.select_all(action="SELECT");bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(source))
    meshes=[o for o in bpy.context.scene.objects if o.type=="MESH"]
    if not meshes: raise RuntimeError("GLB imported no editable mesh")
    # Preserve individual mesh objects; scale as a group without joining any component.
    bb=[o.matrix_world @ Vector(v) for o in meshes for v in o.bound_box]
    lo=[min(v[i] for v in bb) for i in range(3)];hi=[max(v[i] for v in bb) for i in range(3)]
    max_xy=max(hi[0]-lo[0],hi[1]-lo[1],1e-6)
    scale=24/max_xy
    mid=Vector(((lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]))
    # World-space transformation for each root; retain original named children.
    import mathutils
    fix=mathutils.Matrix.Translation(-scale*mid) @ mathutils.Matrix.Scale(scale,4)
    for o in list(bpy.context.scene.objects):
        if o.parent is None and o.type in {"MESH","EMPTY"}:
            o.matrix_world=fix @ o.matrix_world
    stone=mat("AZ | honey Baku limestone",(.69,.59,.44),roughness=.84)
    stone_node=stone.node_tree.nodes.get("Principled BSDF")
    noise=stone.node_tree.nodes.new("ShaderNodeTexNoise");noise.inputs["Scale"].default_value=110
    bump=stone.node_tree.nodes.new("ShaderNodeBump");bump.inputs["Strength"].default_value=.14;bump.inputs["Distance"].default_value=.012
    stone.node_tree.links.new(noise.outputs["Fac"],bump.inputs["Height"])
    stone.node_tree.links.new(bump.outputs["Normal"],stone_node.inputs["Normal"])
    bronze=mat("AZ | dark anodized bronze",(.075,.061,.046),metallic=.77,roughness=.29)
    glass=mat("AZ | architectural glass",(.23,.34,.36),roughness=.08,transmission=.88)
    walnut=mat("AZ | walnut",(.20,.105,.045),roughness=.38)
    for o in meshes:
        name=o.name.lower()
        if any(k in name for k in ["glass","glazing","windowpane","pane"]): material=glass
        elif any(k in name for k in ["frame","bronze","railing","balustrade","metal"]):material=bronze
        elif any(k in name for k in ["wood","door","walnut","soffit"]):material=walnut
        elif any(k in name for k in ["wall","stone","arch","facade","column","parapet"]):material=stone
        else:continue
        o.data.materials.clear();o.data.materials.append(material)
    lawn=mat("Landscape | living lawn",(.095,.18,.085),roughness=.85)
    pavement=mat("Courtyard | limestone slabs",(.55,.49,.39),roughness=.82)
    water=mat("Pool | clear Caspian-blue water",(.024,.19,.25),roughness=.05,transmission=.65)
    pool_edge=mat("Pool | light travertine",(.80,.73,.62),roughness=.68)
    dark=mat("Pool | dark floor",(.023,.095,.12),roughness=.52)
    leaf=mat("Botanical | evergreen olive",(.11,.19,.09),roughness=.92)
    bark=mat("Botanical | trunk",(.21,.135,.07),roughness=.93)
    block("Land plot — original scene, not in GLB",(0,0,-.34),(68,63,.5),lawn)
    block("Main forecourt", (0,-19,-.05),(41,17,.13),pavement)
    # Separate inset pool and physically based transparent water.
    block("Pool shell",(12,-19,.018),(12.8,6.8,.15),pool_edge,.06)
    block("Pool cavity bed",(12,-19,.115),(12.0,6.0,.075),dark)
    block("Pool water surface",(12,-19,.19),(11.7,5.7,.02),water)
    for i in range(14):
        y=-13.3-i*.92
        block(f"Path slab {i:02d}",(-11,y,.015),(2.2,.73,.12),pool_edge,.018)
    rng=random.Random(2026)
    for i,(x,y) in enumerate([(-26,-7),(-26,-14),(-25,-22),(27,0),(28,-7),(27,-16),(24,14),(-26,11)]):
        h=rng.uniform(3.8,5.4)
        block(f"Olive trunk {i:02d}",(x,y,h*.27),(.38,.38,h*.55),bark,.08)
        sphere(f"Olive canopy {i:02d}",(x,y,h*.72),(.95,1.1,h*.32),leaf)
    area("Entrance softbox",(-5,-10,9),1750,size=10,color=(1,.86,.69))
    area("Pool reflection light",(13,-19,12),1500,size=8,color=(.74,.84,1))
    world=bpy.context.scene.world or bpy.data.worlds.new("Clean sun-and-sky")
    bpy.context.scene.world=world;world.use_nodes=True
    world.node_tree.nodes["Background"].inputs["Color"].default_value=(.55,.68,.82,1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value=.42
    sun=bpy.data.lights.new("Caspian golden hour | Sun","SUN")
    sun.energy=2.3;sun.angle=math.radians(5.5);sun.color=(1,.81,.60)
    obj=bpy.data.objects.new("Caspian golden hour | Sun",sun);bpy.context.collection.objects.link(obj)
    obj.rotation_euler=(math.radians(32),math.radians(-17),math.radians(-43))
    camera=bpy.data.cameras.new("ARCHVIZ 35mm | 60-second aerial-to-courtyard")
    cam=bpy.data.objects.new("Camera 60s",camera);bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera=cam;camera.lens=35;camera.clip_end=500
    target=bpy.data.objects.new("Cinematic target",None);bpy.context.collection.objects.link(target)
    track=cam.constraints.new(type="TRACK_TO");track.target=target;track.track_axis="TRACK_NEGATIVE_Z";track.up_axis="UP_Y"
    # 1440 frames at 24 fps, six contiguous cinematographic moves.
    frames=[1,192,432,720,1008,1272,1440]
    poses=[(38,-52,23),(14,-41,12),(-20,-32,9),(-32,0,15),(10,30,14),(39,-18,15),(32,-48,20)]
    looks=[(0,0,4),(0,0,4),(-5,0,4),(0,0,5),(1,1,5),(0,0,4),(0,0,4)]
    for f,p,t in zip(frames,poses,looks):
        cam.location=p;target.location=t;cam.keyframe_insert(data_path="location",frame=f);target.keyframe_insert(data_path="location",frame=f)
    for obj in [cam,target]:
        if obj.animation_data and obj.animation_data.action:
            for fc in obj.animation_data.action.fcurves:
                for kp in fc.keyframe_points:kp.interpolation="BEZIER"
    scene=bpy.context.scene;scene.frame_start=1;scene.frame_end=1440;scene.render.fps=24
    scene.render.engine="CYCLES";scene.cycles.samples=args.samples
    scene.cycles.use_denoising=True
    scene.render.resolution_x=args.resolution[0];scene.render.resolution_y=args.resolution[1]
    scene.render.resolution_percentage=100
    scene.view_settings.view_transform="AgX"
    scene.render.image_settings.file_format="PNG";scene.render.image_settings.color_mode="RGBA"
    scene.render.filepath=str(out/"frames"/"frame_")
    (out/"frames").mkdir(exist_ok=True)
    scene.camera=cam
    bpy.ops.wm.save_as_mainfile(filepath=str(out/"villa_master.blend"))
    print(f"Built editable scene, {len(meshes)} original named GLB mesh components preserved; 1440 frames @24fps")
    if args.render: bpy.ops.render.render(animation=True)
if __name__=="__main__":create()
