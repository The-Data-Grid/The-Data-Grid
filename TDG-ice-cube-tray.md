# The archetypal 'Ice Cube Tray' example

### Question: How would we represent an ice cube tray and its ice cubes?

### Setup

We want to observe ice-water ratios of ice cube trays. The ice cube tray has characteristics *color*, *name*, *cell dimension*, and many cells which each have characteristics *tray location*, *ice-water ratio*. Notice that in this setup *ice-water ratio* is observational data, while the others are static to the item they characterize. 



### *Answer 1: Strict item hierarchy* 

`ice cube tray` is a non-observable item and each `ice cube tray cell` is a child item which requires the `ice cube tray` item. 

**`ice cube tray` non-observable item data columns**: color, name, cell dimension

**`ice cube tray cell` feature data columns**: tray location, ice-water ratio

```json
"non-observable item": {
    "name": "ice cube tray"
}

"feature": {
    "name": "ice cube tray cell",
	"required items": [
        {
            name: "ice cube tray",
            id: true,
            nullable: false
        }
    ]
}
```

------



### *Answer 2: Use of subfeatures*

`ice cube tray` is the the only item, with a subfeature representing each cell.

**`ice cube tray` feature data columns**: color, name, cell dimension

**`cell` subfeature data columns**: tray location, ice-water ratio

```json
"feature": {
    "name": "ice cube tray"
}

"subfeature": {
    "name": "cell"
}
```

------



**Here is an example data column**

```json
"data columns": [
    {
        "item": "ice cube tray",
        "name": "color",
        "nullable": false,
        "type": {
            "reference": "item-factor",
            "fill": ["green", "blue", "yellow"],
            "data": "text"
        }
    },
    ...
]
```



