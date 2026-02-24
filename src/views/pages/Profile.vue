<template>
  <v-container fluid class="down-top-padding">
    <v-row>
      <v-col cols="12" lg="4">
        <v-card>
          <v-card-text class="text-center pa-7">
            <img
              src="https://randomuser.me/api/portraits/men/81.jpg"
              alt="user"
              width="150px"
              class="img-fluid rounded-circle shadow-sm"
            />
            <h4 class="mt-2 text-h6 text-blue-grey-darken-2 font-weight-regular">Hanna Gover</h4>
            <h6 class="text-subtitle-2 font-weight-light">Accounts Manager Amix corp</h6>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-text>
            <h3 class="text-h6 text-blue-grey-darken-2 font-weight-regular">Default Form</h3>
            <h6 class="text-subtitle-2 font-weight-light">All with vuetify element attributes</h6>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-text>
            <v-text-field
              v-model="dtext"
              label="Default Text e.g. 'George deo'"
              variant="filled"
              bg-color="transparent"
            ></v-text-field>
            <v-text-field
              type="email"
              v-model="emailtext"
              label="Email e.g. 'example@gmail.com'"
              variant="filled"
              bg-color="transparent"
            ></v-text-field>
            <v-text-field
              v-model="password"
              variant="filled"
              bg-color="transparent"
              :append-inner-icon="show1 ? 'mdi-eye' : 'mdi-eye-off'"
              :rules="[rules.required, rules.min]"
              :type="show1 ? 'text' : 'password'"
              label="Password"
              hint="At least 8 characters"
              counter
              @click:append-inner="show1 = !show1"
            ></v-text-field>
            <v-textarea
              variant="filled"
              rows="3"
              label="Textarea"
              bg-color="transparent"
            ></v-textarea>
            <div class="mt-4">
              <v-select :items="selectItems" variant="filled" label="Select Country" bg-color="transparent"></v-select>
            </div>
            <v-btn class="text-capitalize mt-5" color="success">Submit</v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'

const dtext = ref('George deo')
const emailtext = ref('')
const password = ref('')
const show1 = ref(false)

const rules = {
  required: (value) => !!value || 'Required.',
  min: (v) => v.length >= 8 || 'Min 8 characters',
}

const selectItems = ['London', 'India', 'America']
</script>
