class ArrayUtil {

    /**
     * @param {Array} array with duplicates
     * @returns {Array} array without duplicates
     */
    static function removeDuplicatesFromArray(array) {

        var keys = {};
        var uniques = [];

        for(var i=0; i< array.length; i++) {
            var elem = array[i];
            if(!keys.hasOwnProperty(elem)) {
                keys[elem] = true;
                uniques.push(elem);
            }
        }

        return uniques;
    }

    /**
     * 
     */
    static function itemExistInArray(array, item) {

        var arrayToString = '$'+array.join('$')+'$';
        arrayToString = arrayToString.toLowerCase();
        return arrayToString.indexOf('$'+item.toLowerCase()+'$')>=0;
    }

    /**
     * @param {Array} string array1
     * @param {Array} string array2
     */
    static function ifArraysIdentical(array1, array2) {

        if(array1.length !== array2.length) {
            return false;
        }

        for(var i=0; i<array1.length; i++) {
            if(!itemExistInArray(array2, array1[i])) {
                return false;
            }
        }

        return true;

    }

    /**
     * @param {Object} object to determine whether it's an array
     * @returns {Boolean} array or not array
     */
    static function isArray(obj) {
        var exampleArray = [];

        return obj.GetType() === exampleArray.GetType();
    }
}