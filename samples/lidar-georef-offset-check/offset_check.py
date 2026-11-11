"""Survey-foot vs international-foot check for NAD83 / California Zone 5 (EPSG:2229).
If coordinates stored in US survey feet are read as international feet (or the reverse),
every point shifts by coord * (ftUS/ft - 1) = 2 ppm of its grid coordinate."""
import numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt, json
from pyproj import Transformer
t=Transformer.from_crs("EPSG:4326","EPSG:2229",always_xy=True)
k=0.3048006096012192/0.3048-1
lon=np.linspace(-121.0,-115.6,120); lat=np.linspace(32.6,35.8,90)
LO,LA=np.meshgrid(lon,lat); E,N=t.transform(LO,LA)
dE,dN=E*k,N*k; mag=np.hypot(dE,dN)
fig,ax=plt.subplots(figsize=(9,5.6),dpi=130)
c=ax.contourf(LO,LA,mag,levels=20,cmap="magma"); fig.colorbar(c,label="horizontal shift (ft)")
cs=ax.contour(LO,LA,mag,levels=[12,13,14],colors="w",linewidths=.6); ax.clabel(cs,fmt="%.0f ft")
pts={"Los Angeles":(-118.25,34.05),"Santa Barbara":(-119.70,34.42),"Bakersfield":(-119.0,35.4),"Barstow":(-117.0,34.9),"Ventura":(-119.29,34.28)}
rows=[]
for n,(x,y) in pts.items():
    e,nn=t.transform(x,y); rows.append(dict(place=n,easting_ftUS=round(e),northing_ftUS=round(nn),dE_ft=round(e*k,2),dN_ft=round(nn*k,2),total_ft=round(float(np.hypot(e*k,nn*k)),2)))
    ax.plot(x,y,"c^"); ax.annotate(n,(x,y),xytext=(4,4),textcoords="offset points",color="c",fontsize=8)
ax.set_title("NAD83 CA Zone 5: shift if US survey ft and international ft are mixed\n(easting ~12-14 ft, northing ~3-4 ft: matches a 3-14 ft offset pattern)")
ax.set_xlabel("longitude"); ax.set_ylabel("latitude"); fig.tight_layout(); fig.savefig("ftus_vs_ft_shift_zone5.png")
json.dump(rows,open("offsets.json","w"),indent=1); print(json.dumps(rows,indent=1))
