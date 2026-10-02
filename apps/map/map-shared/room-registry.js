/* Safe Havens Peak — M.S.18 Floor-Owned Shared Room Registry
 * Floor modules remain layout/data owners.
 * This registry owns canonical room identity, floor ownership, and destinations.
 * Canonical room URLs are derived from FLOOR_ROOTS instead of duplicated path strings.
 */
(function(global){
  'use strict';
  const VERSION='2.0.0';
  const FLOOR_ROOTS=Object.freeze({
    '1F':'map/floors/1f/rooms',
    '2F':'map/floors/2f/rooms',
    '3F':'map/floors/3f/rooms',
    'Dorms':'map/floors/dorms/rooms'
  });

  function ownedEntry(floor,roomId){
    const root=FLOOR_ROOTS[floor];
    if(!root) throw new Error('Unknown SHP floor ownership: '+floor);
    return root+'/'+roomId+'/index.html';
  }
  const BY_ID=Object.freeze({
    "greenhouse": Object.freeze({"roomId": "greenhouse", "name": "Indoor Greenhouse", "floor": "1F", "entry": ownedEntry("1F","greenhouse"), "launchEnabled": false}),
    "dojo": Object.freeze({"roomId": "dojo", "name": "Dojo", "floor": "1F", "entry": ownedEntry("1F","dojo"), "launchEnabled": false}),
    "girls-bathrooms": Object.freeze({"roomId": "girls-bathrooms", "name": "Girls Bathrooms", "floor": "1F", "entry": ownedEntry("1F","girls-bathrooms"), "launchEnabled": false}),
    "boys-bathrooms": Object.freeze({"roomId": "boys-bathrooms", "name": "Boys Bathrooms", "floor": "1F", "entry": ownedEntry("1F","boys-bathrooms"), "launchEnabled": false}),
    "medicine-closet": Object.freeze({"roomId": "medicine-closet", "name": "Medicine Closet", "floor": "1F", "entry": ownedEntry("1F","medicine-closet"), "launchEnabled": false}),
    "nurses-office": Object.freeze({"roomId": "nurses-office", "name": "Nurse’s Office", "floor": "1F", "entry": ownedEntry("1F","nurses-office"), "launchEnabled": false}),
    "girls-changing-rooms": Object.freeze({"roomId": "girls-changing-rooms", "name": "Girls Changing Rooms", "floor": "1F", "entry": ownedEntry("1F","girls-changing-rooms"), "launchEnabled": false}),
    "boys-changing-rooms": Object.freeze({"roomId": "boys-changing-rooms", "name": "Boys Changing Rooms", "floor": "1F", "entry": ownedEntry("1F","boys-changing-rooms"), "launchEnabled": false}),
    "kitchen": Object.freeze({"roomId": "kitchen", "name": "Kitchen", "floor": "1F", "entry": ownedEntry("1F","kitchen"), "launchEnabled": false}),
    "storage-closet-1f": Object.freeze({"roomId": "storage-closet-1f", "name": "Storage Closet", "floor": "1F", "entry": ownedEntry("1F","storage-closet-1f"), "launchEnabled": false}),
    "supply-closet-1f": Object.freeze({"roomId": "supply-closet-1f", "name": "Supply Closet", "floor": "1F", "entry": ownedEntry("1F","supply-closet-1f"), "launchEnabled": false}),
    "infirmary": Object.freeze({"roomId": "infirmary", "name": "Infirmary", "floor": "1F", "entry": ownedEntry("1F","infirmary"), "launchEnabled": false}),
    "gymnasium": Object.freeze({"roomId": "gymnasium", "name": "Gymnasium", "floor": "1F", "entry": ownedEntry("1F","gymnasium"), "launchEnabled": false}),
    "cafeteria": Object.freeze({"roomId": "cafeteria", "name": "Lunch Room", "floor": "1F", "entry": ownedEntry("1F","cafeteria"), "launchEnabled": true, "launchLabel": "Enter 3D Cafeteria"}),
    "classroom-a-2": Object.freeze({"roomId": "classroom-a-2", "name": "Classroom A-2", "floor": "1F", "entry": ownedEntry("1F","classroom-a-2"), "launchEnabled": false}),
    "classroom-a-4": Object.freeze({"roomId": "classroom-a-4", "name": "Classroom A-4", "floor": "1F", "entry": ownedEntry("1F","classroom-a-4"), "launchEnabled": false}),
    "classroom-a-1": Object.freeze({"roomId": "classroom-a-1", "name": "Classroom A-1", "floor": "1F", "entry": ownedEntry("1F","classroom-a-1"), "launchEnabled": false}),
    "classroom-a-3": Object.freeze({"roomId": "classroom-a-3", "name": "Classroom A-3", "floor": "1F", "entry": ownedEntry("1F","classroom-a-3"), "launchEnabled": false}),
    "classroom-a-5": Object.freeze({"roomId": "classroom-a-5", "name": "Classroom A-5", "floor": "1F", "entry": ownedEntry("1F","classroom-a-5"), "launchEnabled": false}),
    "library": Object.freeze({"roomId": "library", "name": "Library", "floor": "1F", "entry": ownedEntry("1F","library"), "launchEnabled": false}),
    "front-office": Object.freeze({"roomId": "front-office", "name": "Front Office", "floor": "1F", "entry": ownedEntry("1F","front-office"), "launchEnabled": false}),
    "test-room-study-area": Object.freeze({"roomId": "test-room-study-area", "name": "Test Room / Study Area", "floor": "1F", "entry": ownedEntry("1F","test-room-study-area"), "launchEnabled": false}),
    "debate-class": Object.freeze({"roomId": "debate-class", "name": "Debate Class", "floor": "1F", "entry": ownedEntry("1F","debate-class"), "launchEnabled": false}),
    "debate-room": Object.freeze({"roomId": "debate-room", "name": "Debate Room", "floor": "1F", "entry": ownedEntry("1F","debate-room"), "launchEnabled": false}),
    "classroom-a-7": Object.freeze({"roomId": "classroom-a-7", "name": "Classroom A-7", "floor": "1F", "entry": ownedEntry("1F","classroom-a-7"), "launchEnabled": false}),
    "classroom-a-9": Object.freeze({"roomId": "classroom-a-9", "name": "Classroom A-9", "floor": "1F", "entry": ownedEntry("1F","classroom-a-9"), "launchEnabled": false}),
    "classroom-a-6": Object.freeze({"roomId": "classroom-a-6", "name": "Classroom A-6", "floor": "1F", "entry": ownedEntry("1F","classroom-a-6"), "launchEnabled": false}),
    "classroom-a-8": Object.freeze({"roomId": "classroom-a-8", "name": "Classroom A-8", "floor": "1F", "entry": ownedEntry("1F","classroom-a-8"), "launchEnabled": false}),
    "classroom-a-10": Object.freeze({"roomId": "classroom-a-10", "name": "Classroom A-10", "floor": "1F", "entry": ownedEntry("1F","classroom-a-10"), "launchEnabled": false}),
    "ruby-dorm": Object.freeze({"roomId": "ruby-dorm", "name": "Ruby", "floor": "Dorms", "entry": ownedEntry("Dorms","ruby-dorm"), "launchEnabled": false}),
    "fate-dorm": Object.freeze({"roomId": "fate-dorm", "name": "Fate", "floor": "Dorms", "entry": ownedEntry("Dorms","fate-dorm"), "launchEnabled": false}),
    "adair-dorm": Object.freeze({"roomId": "adair-dorm", "name": "Adair", "floor": "Dorms", "entry": ownedEntry("Dorms","adair-dorm"), "launchEnabled": false}),
    "alice-dorm": Object.freeze({"roomId": "alice-dorm", "name": "Alice", "floor": "Dorms", "entry": ownedEntry("Dorms","alice-dorm"), "launchEnabled": false}),
    "milo-dorm": Object.freeze({"roomId": "milo-dorm", "name": "Milo", "floor": "Dorms", "entry": ownedEntry("Dorms","milo-dorm"), "launchEnabled": false}),
    "meggie-dorm": Object.freeze({"roomId": "meggie-dorm", "name": "Meggie", "floor": "Dorms", "entry": ownedEntry("Dorms","meggie-dorm"), "launchEnabled": false}),
    "ludo-dorm": Object.freeze({"roomId": "ludo-dorm", "name": "Ludo", "floor": "Dorms", "entry": ownedEntry("Dorms","ludo-dorm"), "launchEnabled": false}),
    "juno-dorm": Object.freeze({"roomId": "juno-dorm", "name": "Juno", "floor": "Dorms", "entry": ownedEntry("Dorms","juno-dorm"), "launchEnabled": false}),
    "hikari-dorm": Object.freeze({"roomId": "hikari-dorm", "name": "Hikari", "floor": "Dorms", "entry": ownedEntry("Dorms","hikari-dorm"), "launchEnabled": false}),
    "damian-dorm": Object.freeze({"roomId": "damian-dorm", "name": "Damian", "floor": "Dorms", "entry": ownedEntry("Dorms","damian-dorm"), "launchEnabled": false}),
    "aria-dorm": Object.freeze({"roomId": "aria-dorm", "name": "Aria", "floor": "Dorms", "entry": ownedEntry("Dorms","aria-dorm"), "launchEnabled": true, "launchLabel": "Visit Dorm"}),
    "luxi-dorm": Object.freeze({"roomId": "luxi-dorm", "name": "Luxi", "floor": "Dorms", "entry": ownedEntry("Dorms","luxi-dorm"), "launchEnabled": false}),
    "daika-dorm": Object.freeze({"roomId": "daika-dorm", "name": "Daika", "floor": "Dorms", "entry": ownedEntry("Dorms","daika-dorm"), "launchEnabled": false}),
    "tokiko-dorm": Object.freeze({"roomId": "tokiko-dorm", "name": "Tokiko", "floor": "Dorms", "entry": ownedEntry("Dorms","tokiko-dorm"), "launchEnabled": false}),
    "kouji-dorm": Object.freeze({"roomId": "kouji-dorm", "name": "Kouji", "floor": "Dorms", "entry": ownedEntry("Dorms","kouji-dorm"), "launchEnabled": false}),
    "jacey-dorm": Object.freeze({"roomId": "jacey-dorm", "name": "Jacey", "floor": "Dorms", "entry": ownedEntry("Dorms","jacey-dorm"), "launchEnabled": true, "launchLabel": "Visit Dorm"}),
    "tyler-dorm": Object.freeze({"roomId": "tyler-dorm", "name": "Tyler", "floor": "Dorms", "entry": ownedEntry("Dorms","tyler-dorm"), "launchEnabled": false})
  });

  const BY_FLOOR_NAME=Object.freeze(Object.values(BY_ID).reduce((index,room)=>{
    index[room.floor+'::'+room.name]=room.roomId;
    return index;
  },{}));

  function get(roomId){
    return roomId && BY_ID[roomId] ? BY_ID[roomId] : null;
  }

  function resolve(room,floor){
    if(!room) return null;
    if(room.roomId && BY_ID[room.roomId]) return BY_ID[room.roomId];
    const name=typeof room==='string' ? room : room.name;
    if(!name) return null;
    const id=BY_FLOOR_NAME[(floor||room.floor||'')+'::'+name];
    return id ? BY_ID[id] : null;
  }

  function canLaunch(room,floor){
    const entry=resolve(room,floor);
    return !!(entry && entry.launchEnabled && entry.entry);
  }

  function floorRoot(floor){
    return FLOOR_ROOTS[floor] || null;
  }

  function roomsForFloor(floor){
    return Object.freeze(Object.values(BY_ID).filter(room=>room.floor===floor));
  }

  function owns(floor,roomId){
    const room=get(roomId);
    return !!(room && room.floor===floor && room.entry===ownedEntry(floor,roomId));
  }

  global.SHPRoomRegistry=Object.freeze({
    VERSION,FLOOR_ROOTS,BY_ID,BY_FLOOR_NAME,
    get,resolve,canLaunch,floorRoot,roomsForFloor,owns,ownedEntry
  });
})(window);
