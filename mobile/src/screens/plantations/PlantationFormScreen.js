import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Location from "expo-location";
import api from "../../api/client";

const empty = {
  farmer: "", plantationName: "", plantationCode: "", plantationType: "",
  area: "", areaUnit: "Acres", numberOfPlants: "",
  address: { village: "", taluk: "", district: "", state: "" },
  irrigationMethod: "", waterSource: "", soilType: "",
  plantationAgeYears: "", plantVariety: "",
};

export default function PlantationFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const presetFarmerId = route.params?.farmerId;
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ ...empty, farmer: presetFarmerId || "" });
  const [farmers, setFarmers] = useState([]);
  const [coords, setCoords] = useState(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/farmers", { params: { limit: 200 } }).then((res) => setFarmers(res.data.data));
    if (isEdit) {
      api.get(`/plantations/${id}`).then((res) => {
        const p = res.data.data.plantation;
        setForm({ ...empty, ...p, farmer: p.farmer?._id || p.farmer, address: { ...empty.address, ...p.address } });
        if (res.data.data.location) setCoords(res.data.data.location);
      });
    }
  }, [id]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setAddr = (field, value) => setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));

  const captureLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Location access is required to capture GPS coordinates");
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
  };

  const saveLocationIfNeeded = async (plantationId) => {
    if (!coords) return;
    setSavingLocation(true);
    try {
      await api.post(`/plantations/${plantationId}/location`, {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } finally {
      setSavingLocation(false);
    }
  };

  const handleSave = async () => {
    if (!form.farmer || !form.plantationName || !form.plantationCode || !form.area) {
      Alert.alert("Missing info", "Farmer, name, code, and area are required");
      return;
    }
    setSaving(true);
    try {
      let plantationId = id;
      if (isEdit) {
        await api.put(`/plantations/${id}`, form);
      } else {
        const res = await api.post("/plantations", form);
        plantationId = res.data.data._id;
      }
      await saveLocationIfNeeded(plantationId);
      navigation.navigate("PlantationDetails", { id: plantationId });
    } catch (err) {
      Alert.alert("Save failed", err.response?.data?.message || "Please try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.section}>Basic Information</Text>
      <Text style={styles.label}>Farmer *</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.farmer} onValueChange={(v) => setField("farmer", v)} enabled={!isEdit}>
          <Picker.Item label="Select farmer" value="" />
          {farmers.map((f) => <Picker.Item key={f._id} label={`${f.farmerName} (${f.mobileNumber})`} value={f._id} />)}
        </Picker>
      </View>
      <Input label="Plantation Name *" value={form.plantationName} onChangeText={(v) => setField("plantationName", v)} />
      <Input label="Plantation Code *" value={form.plantationCode} onChangeText={(v) => setField("plantationCode", v)} />
      <Input label="Plantation Type" value={form.plantationType} onChangeText={(v) => setField("plantationType", v)} placeholder="e.g. Coconut, Areca, Coffee" />

      <Text style={styles.section}>Area Information</Text>
      <Input label="Area *" value={String(form.area ?? "")} onChangeText={(v) => setField("area", v)} keyboardType="decimal-pad" />
      <Text style={styles.label}>Area Unit</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={form.areaUnit} onValueChange={(v) => setField("areaUnit", v)}>
          <Picker.Item label="Acres" value="Acres" />
          <Picker.Item label="Hectares" value="Hectares" />
        </Picker>
      </View>
      <Input label="Number of Plants/Trees" value={String(form.numberOfPlants ?? "")} onChangeText={(v) => setField("numberOfPlants", v)} keyboardType="number-pad" />

      <Text style={styles.section}>Location Information</Text>
      <Input label="Village" value={form.address.village} onChangeText={(v) => setAddr("village", v)} />
      <Input label="Taluk" value={form.address.taluk} onChangeText={(v) => setAddr("taluk", v)} />
      <Input label="District" value={form.address.district} onChangeText={(v) => setAddr("district", v)} />
      <Input label="State" value={form.address.state} onChangeText={(v) => setAddr("state", v)} />

      <TouchableOpacity style={styles.gpsBtn} onPress={captureLocation}>
        <Text style={styles.editBtnText}>
          {coords ? `📍 ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "📍 Capture Current GPS Location"}
        </Text>
      </TouchableOpacity>

      <Text style={styles.section}>Farming Information</Text>
      <Input label="Irrigation Method" value={form.irrigationMethod} onChangeText={(v) => setField("irrigationMethod", v)} />
      <Input label="Water Source" value={form.waterSource} onChangeText={(v) => setField("waterSource", v)} />
      <Input label="Soil Type" value={form.soilType} onChangeText={(v) => setField("soilType", v)} />

      <Text style={styles.section}>Plantation Information</Text>
      <Input label="Plantation Age (Years)" value={String(form.plantationAgeYears ?? "")} onChangeText={(v) => setField("plantationAgeYears", v)} keyboardType="number-pad" />
      <Input label="Plant Variety" value={form.plantVariety} onChangeText={(v) => setField("plantVariety", v)} />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving || savingLocation}>
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Plantation"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Input({ label, ...props }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f7f3" },
  section: { fontSize: 15, fontWeight: "700", color: "#2f6d3c", marginTop: 12, marginBottom: 6 },
  label: { fontSize: 12, color: "#667", marginBottom: 4 },
  input: { backgroundColor: "#fff", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#ddd" },
  pickerWrap: { backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#ddd", marginBottom: 10 },
  gpsBtn: { backgroundColor: "#5a9367", borderRadius: 8, padding: 12, alignItems: "center", marginVertical: 6 },
  editBtnText: { color: "#fff", fontWeight: "700" },
  button: { backgroundColor: "#2f6d3c", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 20, marginBottom: 40 },
  buttonText: { color: "#fff", fontWeight: "700" },
});
