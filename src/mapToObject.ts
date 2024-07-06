/*
This code defines a function mapToObject that converts a nested Map structure into a plain JavaScript object. It recursively traverses each entry in the map, 
handling nested maps and objects appropriately to ensure that the entire structure is converted correctly. 
The function supports deep nesting and ensures that all nested maps are transformed into corresponding objects.
*/

export function mapToObject(m: Map<any, any>): any {
  let out: any = {};
  // Initializes an empty object to hold the converted map values.

  for (const [k, v] of m.entries()) {
    // Iterates over each entry (key-value pair) in the map.

    if (v instanceof Map) {
      // Checks if the value is a Map.
      out[k] = mapToObject(v);
      // Recursively converts the nested Map to an object.
    } else if (v instanceof Object) {
      // Checks if the value is an Object.
      let secondary: any = {};
      // Initializes a secondary object for nested structures.

      for (let branch of Object.keys(v)) {
        // Iterates over each key in the object.

        if ((v as any)[branch] instanceof Map) {
          // Checks if the nested value is a Map.
          secondary[branch] = mapToObject((v as any)[branch]);
          // Recursively converts the nested Map to an object.
        } else {
          // If the nested value is not a Map.
          secondary[branch] = (v as any)[branch];
          // Assigns the value directly to the secondary object.
        }
      }
      out[k] = secondary;
      // Assigns the secondary object to the main output object.
    } else {
      // If the value is neither a Map nor an Object.
      out[k] = v;
      // Assigns the value directly to the output object.
    }
  }

  return out;
  // Returns the final converted object.
}
